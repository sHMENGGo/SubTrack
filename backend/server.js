const { PrismaClient } = require('./prisma/generated/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookie_parser = require('cookie-parser')
const { login_limiter, register_limiter, two_fa_limiter, read_limiter, write_limiter } = require('./rate_limit')
const bcrypt = require('bcrypt')
const { send_forgot_verification_email, send_register_verification_email } = require('./mailer')
const { get_or_set_cache, delete_cache } = require('./redis')
require('dotenv').config()

const is_production = process.env.NODE_ENV === 'production'

// Prisma 
const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL})
const prisma = new PrismaClient({ adapter })

// Middleware
const app = express()
app.use(cors({ 
	origin: is_production ? process.env.FRONTEND_URL :'http://localhost:5173', 
	credentials: true 
}))
app.use(express.json())
app.use(cookie_parser())
app.set('trust proxy', 1)
const PORT = process.env.PORT || 3001

// Health Check Route
app.get('/', (req, res) => {res.status(200).json({ message: 'Express backend is live and routing!' })})

// Start Server
app.listen(PORT, '0.0.0.0', () => {console.log(`Server is running on port ${PORT}`)})

// Token authentication function
const token_auth = (req, res, next) => {
	const token = req.cookies.token
	if (!token) {return res.status(401).json({ message: 'Access denied. No token provided.', no_token: true })}
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET)
		req.user = decoded
		next()
	} catch (error) {res.status(400).json({ message: 'Invalid token.' })}
}

// Route that cron-job.org use to run daily_automation.js
const { run_daily_job } = require('./daily_automation')
app.get('/cron/daily-job', async (req, res) => {
   const secret = req.headers['x-cron-secret']
   if (secret !== process.env.CRON_SECRET) return res.status(401).json({ message: 'Unauthorized' })
   try {
      await run_daily_job()
      res.json({ message: 'Daily job completed.' })
   } catch (err) {
      console.error('Daily job error:', err)
      res.status(500).json({ message: 'Daily job failed.' })
   }
})


// =============================== Routes =======================================

// Check if currently logged in
app.get('/me', token_auth, read_limiter, async (req, res)=>{res.status(200).json({id: req.user.id, name: req.user.name})})

// Login route
app.post('/login', login_limiter, async (req, res) => {
	const { email, password, remember_me } = req.body

	if(typeof email !== 'string' || email.trim().length === 0) return res.status(400).json({ message: 'Invalid email or password.' })  
	if(typeof password !== 'string' || password.trim().length === 0) return res.status(400).json({ message: 'Invalid email or password.' })  
	if(typeof remember_me !== 'boolean') return res.status(400).json({ message: 'Invalid check box.' })  
	
	try {
		const user = await prisma.user.findUnique({ where: { email: email } })
		const password_match = user && await bcrypt.compare(password, user.password)
		if (!user || !password_match) {return res.status(400).json({ message: 'Invalid email or password.' })}
		const token = jwt.sign({ id: user.id, name: user.name }, process.env.JWT_SECRET, { expiresIn: (remember_me ? '30d' : '1hr') })
		
		res.cookie('token', token, { 
			httpOnly: true, 
			secure: is_production,
			sameSite: is_production ? 'none' : 'strict',
			...(remember_me ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : { maxAge: 60 * 60 * 1000 }) // 30 days or 1 hours
		})
		
		res.status(200).json({ message: 'Login successful!' })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Error occurred while logging in.' })}
})

// Logout route
app.get('/logout', token_auth, read_limiter, (req, res) => {
	try {
		res.clearCookie('token', {
			httpOnly: true, 
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			// secure: true
		})
		res.status(200).json({ message: 'Logout successful!' })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Error occurred while logging out.' })
	}
})

// Register, send verification code
app.post('/register/send_code', register_limiter, async (req, res) => {
	const { reg_email } = req.body

	if(!reg_email) return res.status(400).json({ message: 'Email is required.' })
	if(typeof reg_email !== 'string' || reg_email.trim().length === 0) return res.status(400).json({ message: 'Invalid email.' })  

	try {
		const email = await prisma.user.findUnique({ where: { email: reg_email } })
		if(email) return res.status(400).json({ message: 'Email already used.' })

      const code = Math.floor(100000 + Math.random() * 900000).toString() // 6 digits
		const verification_token = jwt.sign({ reg_email, code }, process.env.JWT_SECRET, { expiresIn: '10m' })
		
		res.cookie('verification_token', verification_token, {
         httpOnly: true,
         maxAge: 10 * 60 * 1000, // 10 min
         sameSite: is_production ? 'none' : 'lax',
			secure: is_production
      })
		await send_register_verification_email(reg_email, code)

      res.json({ message: 'Verification code sent.' })
   } catch (err) {
      console.error(err)
      res.status(500).json({ message: 'Failed to send verification code.' })
   }
})

// Register, verify code
app.post('/register/verify_code', two_fa_limiter, async (req, res) => {
   const { code, reg_name, reg_password, reg_email } = req.body
	const verification_token = req.cookies.verification_token

	if(!verification_token) return res.status(400).json({ message: 'No token sent.' })
	if(typeof code !== 'string' || code.trim().length === 0) return res.status(400).json({ message: 'Invalid code.' })  
	if(typeof reg_name !== 'string' || reg_name.trim().length === 0) return res.status(400).json({ message: 'Invalid name.' })  
	if(typeof reg_password !== 'string' || reg_password.trim().length === 0) return res.status(400).json({ message: 'Invalid password.' })  
	if(typeof reg_email !== 'string' || reg_email.trim().length === 0) return res.status(400).json({ message: 'Invalid email.' })  

   try {
		const password_hash = await bcrypt.hash(reg_password, 11)
		const decoded = jwt.verify(verification_token, process.env.JWT_SECRET)
		if(decoded.code === code){
			await prisma.user.create({data: {
        	name: reg_name, 
        	password: password_hash, 
        	email: reg_email}})
		} else { res.status(400).json({ message: 'Invalid code.' }) }
      res.status(201).json({ message: 'Account registered successfully.' })
   } catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Error registering user.' })
	}
})

// Forgot password, send code
app.post('/forgot/send_code', register_limiter, async (req, res) => {
	const { email } = req.body

	if(!email) return res.status(400).json({ message: 'Email is required.' })
	if(typeof email !== 'string' || email.trim().length === 0) return res.status(400).json({ message: 'Invalid email.' })  

	try {
		const user = await prisma.user.findFirst({ where: { email: email } })
		if(!user) return res.status(400).json({ message: 'This email is not registered.' })  
		const email_db = user.email
      
		const code = Math.floor(100000 + Math.random() * 900000).toString() // 6 digits
		const verification_token_forgot = jwt.sign({ email_db, code }, process.env.JWT_SECRET, { expiresIn: '10m' })
		
		res.cookie('verification_token_forgot', verification_token_forgot, {
         httpOnly: true,
         maxAge: 10 * 60 * 1000, // 10 min
         sameSite: is_production ? 'none' : 'lax',
			secure: is_production
      })
		await send_forgot_verification_email(email_db, code)

      res.json({ email: email_db, message: 'Verification code sent.' })
   } catch (err) {
      console.error(err)
      res.status(500).json({ message: 'Failed to send verification code.' })
   }
})
// Forgot password, verify code
app.post('/forgot/verify_code', two_fa_limiter, async (req, res) => {
   const { forgot_code } = req.body

	const verification_token_forgot = req.cookies.verification_token_forgot
	if(!verification_token_forgot) return res.status(400).json({ message: 'No token sent.' })

   try {
		const decoded = jwt.verify(verification_token_forgot, process.env.JWT_SECRET)
		if(decoded.code !== forgot_code){ res.status(400).json({ message: 'Invalid code.' }) }
      res.status(200).json({ message: 'Verification success.' })
   } catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Error verifying code.' })
	}
})
// Change password after authentication of forgot password
app.put('/forgot/change_password', two_fa_limiter, async (req, res) => {
   const { new_password } = req.body

	if(!new_password) return res.status(400).json({ message: 'Input password.' })
	if(typeof new_password !== 'string') return res.status(400).json({ message: 'Invalid password.' })

	const verification_token_forgot = req.cookies.verification_token_forgot
	if(!verification_token_forgot) return res.status(400).json({ message: 'No token sent.' })

   try {
		const new_password_hash = await bcrypt.hash(new_password, 11)
		const decoded = jwt.verify(verification_token_forgot, process.env.JWT_SECRET)
		await prisma.user.update({
			where: { email: decoded.email_db },
			data: { password: new_password_hash }
		})

      res.status(200).json({ message: 'Password changed successfully.' })
   } catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Error changing password.' })
	}
})

// Get profile
app.get('/profile', token_auth, read_limiter, async (req, res) => {
	try {
		const user = await prisma.user.findUnique({ where: { id: req.user.id } })
		res.status(200).json({ name: user.name, email: user.email, password: user.password, message: 'Profile retrieved successfully.' })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Error retrieving profile.' })
	}
})

// Edit profile
app.put('/edit/profile', token_auth, write_limiter, async (req, res) => {
	const { new_name, new_email, current_password, new_password } = req.body
	
	if(typeof new_name !== 'string') return res.status(400).json({ message: 'Invalid name.' })  
	if(typeof new_email !== 'string') return res.status(400).json({ message: 'Invalid email.' })  
	if(typeof new_password !== 'string') return res.status(400).json({ message: 'Invalid password.' })  
	
	try {
		const user = await prisma.user.findUnique({ where: { id: req.user.id } })
		const password_match = user && await bcrypt.compare(current_password, user.password)
		if(!password_match) return res.status(401).json({ message: 'Invalid current password.' })
		else {
			const new_password_hash = await bcrypt.hash(new_password, 11)
			await prisma.user.update({
				where: { id: req.user.id },
				data: {
					name: new_name,
					email: new_email,
					password: new_password_hash
				}
			})
		}

		res.status(200).json({ message: 'Profile edited successfully.' })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Error editing profile.' })
	}
})

// Get subscription of current user
app.post('/subscription', token_auth, write_limiter, async (req, res) => {
	const { filter_category, filter_status } = req.body
	if(typeof filter_status !== 'string') return res.status(400).json({ message: 'Invalid status.' })  
	const month_name = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

	const cache_key = `subscriptions:${req.user.id}:${filter_category ?? 'none'}:${filter_status}`
	try {
		const result = await get_or_set_cache(cache_key, 120, async ()=> {
			const subscriptions = await prisma.subscription.findMany({ 
				where: { 
					user_id: req.user.id,
					category_id: filter_category === 0 ? null : (filter_category || undefined),
					is_active: filter_status === 'all' ? undefined : filter_status === 'true' ? true : filter_status === 'false' ? false : undefined
				},
				include: { category: { select: { name: true, color_hex: true } } },
				orderBy: { next_billing_date: 'asc' }
			})
			
			const formatted_subs = subscriptions.map(sub => {
				const bill_date = new Date(sub.next_billing_date)
				switch(sub.duration){
					case 'weekly': bill_date.setDate(bill_date.getDate() - 7); break
					case 'monthly': bill_date.setMonth(bill_date.getMonth() - 1); break
					case 'yearly': bill_date.setFullYear(bill_date.getFullYear() - 1); break
				}

				const prev_month = month_name[bill_date.getMonth()]
				const prev_day = bill_date.getDate()
				const prev_year = bill_date.getFullYear()
				
				return {
					...sub,
					amount: Number(sub.amount).toFixed(2),
					prev_month,
					prev_day,
					prev_year,
					month: month_name[sub.next_billing_date.getMonth()],
					day: String(sub.next_billing_date.getDate()).padStart(2, '0'),
					year: String(sub.next_billing_date.getFullYear())
				}
			})

			return { formatted_subs }
		})
		
		res.status(200).json({ subscriptions: result.formatted_subs, message: 'Subscriptions retrieved successfully.' })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Error retrieving subscriptions.' })
	}
})

// Add subscription for current user
app.post('/add/subscription', token_auth, write_limiter, async (req, res) => {
	const { sub_name, sub_amount, sub_currency, sub_month, sub_day, sub_category_id, sub_duration } = req.body
	
	if(typeof sub_name !== 'string' || sub_name.trim().length === 0) return res.status(400).json({ message: 'Invalid name.' })  
	if(typeof sub_amount !== 'number' || sub_amount.length === 0) return res.status(400).json({ message: 'Invalid amount.' })  
	if(typeof sub_currency !== 'string' || sub_currency.trim().length === 0) return res.status(400).json({ message: 'Invalid currency.' })  
	if(typeof sub_month !== 'string' || sub_month.trim().length === 0) return res.status(400).json({ message: 'Invalid month.' })  
	if(typeof sub_day !== 'number' || sub_day.length === 0) return res.status(400).json({ message: 'Invalid day.' })  
	if(typeof sub_category_id !== 'number' || sub_category_id.length === 0) return res.status(400).json({ message: 'Invalid category.' })  
	if(typeof sub_duration !== 'string') return res.status(400).json({ message: 'Invalid duration.' })  
	
	const month_name = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	const today = new Date()
	today.setDate(sub_day)
	today.setHours(0, 0, 0, 0)

	const month_index = month_name.indexOf(sub_month) + 1
	let base_date = new Date(today.getFullYear(), month_index, sub_day)

	if (base_date > today) base_date.setFullYear(base_date.getFullYear() - 1)
	const next_date = new Date(base_date)
	while (next_date < today) {
		switch (sub_duration) {
			case 'weekly': next_date.setDate(next_date.getDate() + 7); break
			case 'monthly': next_date.setMonth(next_date.getMonth() + 1); break
			case 'yearly': next_date.setFullYear(next_date.getFullYear() + 1); break
		}
	}
	// Format the date to YYYY-MM-DD
	const date_string = `${today.getFullYear()}-${String(next_date.getMonth() + 1).padStart(2,'0')}-${String(next_date.getDate()).padStart(2,'0')}T00:00:00.000Z`
	try {
		const sub = await prisma.subscription.findFirst({ where: { name: sub_name, user_id: req.user.id } })
		if(sub) return res.status(400).json({ message: 'Subscription already exist.' })

		await prisma.subscription.create({ data: {
			name: sub_name,
			amount: sub_amount,
			next_billing_date: date_string,
			user_id: req.user.id,
			category_id: sub_category_id === 0 ? null : sub_category_id,
			currency: sub_currency,
			duration: sub_duration
		} })

		// Delete cache because the data change
		await delete_cache(`subscriptions:${req.user.id}:*`)
		await delete_cache(`monthly_spends:${req.user.id}`)
		await delete_cache(`total_active_subs:${req.user.id}`)
		await delete_cache(`total_due_1_week:${req.user.id}:*`)
		await delete_cache(`total_budget_left:${req.user.id}:*`)
		await delete_cache(`renewals:${req.user.id}:*`)
		await delete_cache(`category_spent:${req.user.id}:*`)
		await delete_cache(`budget_summary:${req.user.id}:*`)
		await delete_cache(`category_budget:${req.user.id}:*`)

		res.status(201).json({ message: 'Subscription added successfully.' })
	} catch (error) {
		console.error(error)
		res.status(500).json({ message: 'Error adding subscription.' })}
})

// Edit subscription of current user
app.put('/edit/subscription', token_auth, write_limiter, async (req, res) => {
	const { sub_id, new_sub_name, new_sub_amount, new_sub_currency, new_sub_is_active, new_sub_month, new_sub_day, new_sub_category_id, new_sub_duration } = req.body 

	if(typeof new_sub_name !== 'string' || new_sub_name.trim().length === 0) return res.status(400).json({ message: 'Invalid name.' })  
	if(typeof new_sub_currency !== 'string' || new_sub_currency.trim().length === 0) return res.status(400).json({ message: 'Invalid currency.' })  
	if(typeof new_sub_is_active !== 'boolean') return res.status(400).json({ message: 'Invalid checkbox.' })  
	if(typeof new_sub_month !== 'string' || new_sub_month.trim().length === 0) return res.status(400).json({ message: 'Invalid month.' })  
	if(typeof new_sub_day !== 'number' || new_sub_day.length === 0) return res.status(400).json({ message: 'Invalid day.' })  
	if(typeof new_sub_category_id !== 'number' || new_sub_category_id.length === 0) return res.status(400).json({ message: 'Invalid category.' })  
	if(typeof new_sub_duration !== 'string' || new_sub_duration.trim().length === 0) return res.status(400).json({ message: 'Invalid duration.' })  
	
	const month_name = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	// Build the last due date from the actual input
	const month_index = month_name.indexOf(new_sub_month) + 1
	let base_date = new Date(today.getFullYear(), month_index, new_sub_day)
	// If that lands in the future this year, it must have been last year instead
	if (base_date > today) base_date.setFullYear(base_date.getFullYear() - 1)
	// Advance one cycle at a time until we pass today
	const next_date = new Date(base_date)
	while (next_date < today) {
		switch (new_sub_duration) {
			case 'weekly': next_date.setDate(next_date.getDate() + 7); break
			case 'monthly': next_date.setMonth(next_date.getMonth() + 1); break
			case 'yearly': next_date.setFullYear(next_date.getFullYear() + 1); break
		}
	}
	const new_date_string = `${next_date.getFullYear()}-${String(next_date.getMonth() + 1).padStart(2, '0')}-${String(next_date.getDate()).padStart(2, '0')}T00:00:00.000Z`
	
	try {
		await prisma.subscription.update({ 
			where: { id: sub_id, user_id: req.user.id }, 
			data: {
				name: new_sub_name,
				amount: new_sub_amount,
				category_id: new_sub_category_id === 0 ? null : new_sub_category_id,
				next_billing_date: new_date_string,
				currency: new_sub_currency,
				is_active: new_sub_is_active,
				duration: new_sub_duration
			}
		})

		// Delete cache because the data change
		await delete_cache(`subscriptions:${req.user.id}:*`)
		await delete_cache(`monthly_spends:${req.user.id}`)
		await delete_cache(`total_active_subs:${req.user.id}`)
		await delete_cache(`total_due_1_week:${req.user.id}:*`)
		await delete_cache(`total_budget_left:${req.user.id}:*`)
		await delete_cache(`renewals:${req.user.id}:*`)
		await delete_cache(`category_spent:${req.user.id}:*`)
		await delete_cache(`budget_summary:${req.user.id}:*`)
		await delete_cache(`category_budget:${req.user.id}:*`)

		res.status(200).json({ message: 'Subscription updated successfully.' })
	} catch (error) {
		console.error(error)
		res.status(500).json({ message: 'Error updating subscription.' })
	}
})

// Delete subscription of current user
app.delete('/delete/subscription', token_auth, write_limiter, async (req, res) => {
	const { subscription_id } = req.body
	if(typeof subscription_id !== 'string' || subscription_id.trim().length === 0) return res.status(400).json({ message: 'Invalid subscription.' })  
	
	try {
		await prisma.subscription.delete({ where: { id: subscription_id, user_id: req.user.id } })
		
		// Delete cache because the data change
		await delete_cache(`subscriptions:${req.user.id}:*`)
		await delete_cache(`monthly_spends:${req.user.id}`)
		await delete_cache(`total_active_subs:${req.user.id}`)
		await delete_cache(`total_due_1_week:${req.user.id}:*`)
		await delete_cache(`total_budget_left:${req.user.id}:*`)
		await delete_cache(`renewals:${req.user.id}:*`)
		await delete_cache(`category_spent:${req.user.id}:*`)
		await delete_cache(`budget_summary:${req.user.id}:*`)
		await delete_cache(`category_budget:${req.user.id}:*`)

		res.status(200).json({ message: 'Subscription deleted successfully.' })
	} catch (error) {res.status(500).json({ message: 'Error deleting subscription.' })}
})

// Get categories of current user
app.get('/category', token_auth, read_limiter, async (req, res) => {
	const cache_key = `categories:${req.user.id}`
	try {
		const categories = await get_or_set_cache(cache_key, 120, async ()=> {
			return await prisma.category.findMany({ where: { user_id: req.user.id } })
		})
		res.status(200).json({ categories })
	} catch (error) {res.status(500).json({ message: 'Error retrieving categories.' })}
})

// Add category for current user
app.post('/add/category', token_auth, write_limiter, async (req, res) => {
	const { category_name, category_color } = req.body
	if(typeof category_name !== 'string' || category_name.trim().length === 0) return res.status(400).json({ message: 'Invalid name.' })  
	if(typeof category_color !== 'string' || category_color.trim().length === 0) return res.status(400).json({ message: 'Invalid color.' })  
	
	try {
		const category = await prisma.category.findFirst({ where: { name: category_name, user_id: req.user.id } })
		if(category) return res.status(400).json({ message: 'Category already exist.' })  

		await prisma.category.create({ data: {
			name: category_name,
			color_hex: category_color,
			user_id: req.user.id
		} })

		// Delete cache because the data change
		await delete_cache(`categories:${req.user.id}`)
		await delete_cache(`category_spent:${req.user.id}:*`)
		await delete_cache(`category_summary:${req.user.id}`)
		await delete_cache(`category_budget:${req.user.id}:*`)

		res.status(201).json({ message: 'Category added successfully.' })
	} catch (error) {res.status(500).json({ message: 'Error adding category.' })}
})

// Edit category of current user
app.put('/edit/category', token_auth, write_limiter, async (req, res) => {
	const { category_id, new_category_name, new_category_color } = req.body

	if(typeof category_id !== 'number' || category_id.length === 0) return res.status(400).json({ message: 'Invalid category.' })  
	if(typeof new_category_name !== 'string' || new_category_name.trim().length === 0) return res.status(400).json({ message: 'Invalid name.' })  
	if(typeof new_category_color !== 'string' || new_category_color.trim().length === 0) return res.status(400).json({ message: 'Invalid color.' })  

	try {
		await prisma.category.update({ 
			where: { id: category_id, user_id: req.user.id }, 
			data: { 
				name: new_category_name,
				color_hex: new_category_color
			} 
		})

		// Delete cache because the data change
		await delete_cache(`categories:${req.user.id}`)
		await delete_cache(`category_spent:${req.user.id}:*`)
		await delete_cache(`category_summary:${req.user.id}`)
		await delete_cache(`category_budget:${req.user.id}:*`)

		res.status(200).json({ message: 'Category updated successfully.' })
	} catch (error) {res.status(500).json({ message: 'Error updating category.' })}
})

// Delete category of current user
app.delete('/delete/category', token_auth, write_limiter, async (req, res) => {
	const { category_id } = req.body
	if(typeof category_id !== 'number' || category_id.length === 0) return res.status(400).json({ message: 'Invalid category.' })  

	try {
		await prisma.category.delete({ where: { id: category_id, user_id: req.user.id } })
		
		// Delete cache because the data change
		await delete_cache(`categories:${req.user.id}`)
		await delete_cache(`category_spent:${req.user.id}:*`)
		await delete_cache(`category_summary:${req.user.id}`)
		await delete_cache(`category_budget:${req.user.id}:*`)

		res.status(200).json({ message: 'Category deleted successfully.' })
	} catch (error) {res.status(500).json({ message: 'Error deleting category.' })}
})

// Get budget of current user
app.get('/budget', token_auth, read_limiter, async (req, res) => {
	const cache_key = `budgets:${req.user.id}`
	try {
		const budgets = await get_or_set_cache(cache_key, 120, async ()=> {
			return await prisma.budget.findMany({ where: { user_id: req.user.id } })
		})
		res.status(200).json({ budgets })
	} catch (error) {res.status(500).json({ message: 'Error retrieving budgets.' })}
})

// Add budget for current user
app.post('/add/budget', token_auth, write_limiter, async (req, res) => {
	const { budget_amount, category_id, input_month_index, input_year, toggle } = req.body
	
	if(typeof budget_amount !== 'number' || budget_amount.length === 0) return res.status(400).json({ message: 'Invalid amount.' })  
	if(typeof category_id !== 'number' || category_id.length === 0) return res.status(400).json({ message: 'Invalid category.' })  
	if(typeof input_month_index !== 'number' || input_month_index.length === 0) return res.status(400).json({ message: 'Invalid month.' })  
	if(typeof input_year !== 'number' || input_year.length === 0) return res.status(400).json({ message: 'Invalid year.' })  
	if(typeof toggle !== 'string' || toggle.trim().length === 0) return res.status(400).json({ message: 'Invalid currency.' })  
	
	try {
		await prisma.budget.create({ data: {
			amount: budget_amount,
			category_id: category_id,
			month: input_month_index + 1,
			year: input_year,
			user_id: req.user.id,
			currency: toggle
		} })

		// Delete cache because the data change
		await delete_cache(`budgets:${req.user.id}`)
		await delete_cache(`total_budget:${req.user.id}`)
		await delete_cache(`total_budget_left:${req.user.id}:*`)
		await delete_cache(`category_spent:${req.user.id}:*`)
		await delete_cache(`budget_summary:${req.user.id}:*`)
		await delete_cache(`category_budget:${req.user.id}:*`)

		res.status(201).json({ message: 'Budget added successfully.' })
	} catch (error) {
		console.error(error)
		res.status(500).json({ message: 'Error adding budget.' })
	}
})

// Edit budget of current user
app.put('/edit/budget', token_auth, write_limiter, async (req, res) => {
	const { budget_id, new_budget_amount, input_month_index, input_year } = req.body

	if(typeof budget_id !== 'string' || budget_id.trim().length === 0) return res.status(400).json({ message: 'Invalid budget.' })  
	if(typeof input_month_index !== 'number' || input_month_index.length === 0) return res.status(400).json({ message: 'Invalid month.' })  
	if(typeof input_year !== 'number' || input_year.length === 0) return res.status(400).json({ message: 'Invalid year.' })  

	try {
		await prisma.budget.update({ 
			where: { id: budget_id, month: input_month_index + 1, year: input_year, user_id: req.user.id },
			data: { amount: new_budget_amount } 
		})

		// Delete cache because the data change
		await delete_cache(`budgets:${req.user.id}`)
		await delete_cache(`total_budget:${req.user.id}`)
		await delete_cache(`total_budget_left:${req.user.id}:*`)
		await delete_cache(`category_spent:${req.user.id}:*`)
		await delete_cache(`budget_summary:${req.user.id}:*`)
		await delete_cache(`category_budget:${req.user.id}:*`)

		res.status(200).json({ message: 'Budget updated successfully.' })
	} catch (error) {
		console.error(error)
		res.status(500).json({ message: 'Error updating budget.' })
	}
})

// Delete budget of current user
app.delete('/delete/budget', token_auth, write_limiter, async (req, res) => {
	const { budget_to_delete, toggle, input_month_index, input_year } = req.body

	if(typeof budget_to_delete !== 'string' || budget_to_delete.trim().length === 0) return res.status(400).json({ message: 'Invalid budget.' })  
	if(typeof toggle !== 'string' || toggle.trim().length === 0) return res.status(400).json({ message: 'Invalid currency.' })  
	if(typeof input_month_index !== 'number' || input_month_index.length === 0) return res.status(400).json({ message: 'Invalid month.' })  
	if(typeof input_year !== 'number' || input_year.length === 0) return res.status(400).json({ message: 'Invalid year.' })  

	try {
		await prisma.budget.delete({ 
			where: { 
				id: budget_to_delete, 
				user_id: req.user.id,
				month: input_month_index + 1,
				currency: toggle,
				year: input_year
			}
		})

		// Delete cache because the data change
		await delete_cache(`budgets:${req.user.id}`)
		await delete_cache(`total_budget:${req.user.id}`)
		await delete_cache(`total_budget_left:${req.user.id}:*`)
		await delete_cache(`category_spent:${req.user.id}:*`)
		await delete_cache(`budget_summary:${req.user.id}:*`)
		await delete_cache(`category_budget:${req.user.id}:*`)

		res.status(200).json({ message: 'Budget deleted successfully.' })
	} catch (error) {
		console.error(error)
		res.status(500).json({ message: 'Error deleting budget.' })
	}
})

// Get subscription history of current user
app.post('/history', token_auth, write_limiter, async (req, res) => {
	const { filter_category, filter_days } = req.body
	if (typeof filter_days !== 'string') return res.status(400).json({ message: 'Invalid day.' })

	const month_name = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
	const today = new Date();
	const today_year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, '0');
	const month_start = new Date(`${today_year}-${month}-01T00:00:00.000Z`);
	const year_start = new Date(`${today_year}-01-01T00:00:00.000Z`);

	const where_query = { user_id: req.user.id }
	if (filter_category === 0) where_query.subscription = { category: null }
	if (filter_category !== "" && filter_category !== undefined) where_query.subscription = { category: { id: filter_category } }

	if (filter_days === '30') {
		const thirty_days_ago = new Date();
		thirty_days_ago.setDate(thirty_days_ago.getDate() - 30);
		where_query.billing_date = { gte: thirty_days_ago };
	} else if (filter_days === '90') {
		const ninety_days_ago = new Date();
		ninety_days_ago.setDate(ninety_days_ago.getDate() - 90);
		where_query.billing_date = { gte: ninety_days_ago };
	} else if (filter_days === 'year') {
		where_query.billing_date = { gte: year_start };
	}

	const cache_key = `histories:${req.user.id}:${filter_category}:${filter_days}`
	try {
		const result = await get_or_set_cache(cache_key, 120, async () => {
			const histories = await prisma.paymentHistory.findMany({
				where: where_query,
				include: {
					subscription: {
						include: { category: { select: { id: true, name: true, color_hex: true } } }
					}
				},
				orderBy: { billing_date: 'desc' }
			})

			const month_amount = { php: 0, usd: 0 };
			const year_amount = { php: 0, usd: 0 };

			histories.forEach(history => {
				const billing_date = new Date(history.billing_date);
				const currency = history.currency.toLowerCase()
				if (billing_date < today) {
					const amount = Number(history.amount);
					if (billing_date >= month_start) month_amount[currency] += amount
					if (billing_date >= year_start) year_amount[currency] += amount
				}
			})

			const groups = histories.reduce((acc, history) => {
				const billing_date = new Date(history.billing_date)
				const group_key = `${month_name[billing_date.getMonth()]} ${billing_date.getFullYear()}`
				const month_day = month_name[billing_date.getMonth()] + ' ' + String(billing_date.getDate()).padStart(2, '0')

				if (!acc[group_key]) acc[group_key] = []
				acc[group_key].push({ ...history, month_day })

				return acc
			}, {})

			return { groups, month_amount, year_amount }
		})

		res.status(200).json({
			formatted_histories: result.groups,
			month_amount: result.month_amount,
			year_amount: result.year_amount
		});
	} catch (error) {
		console.error('Error retrieving history: ', error);
		res.status(500).json({ message: 'Error retrieving subscription history.' });
	}
})

// Get notifications of current user
app.get('/notification', token_auth, read_limiter, async (req, res) => {
	const month_name = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	const cache_key = `notifications:${req.user.id}`
	try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			const notifications = await prisma.notification.findMany({ 
				where: { user_id: req.user.id },
				include: { subscription: true },
				orderBy: { notify_at: 'desc' }
			})
			const formatted_notifications = notifications.map(notif => ({
				...notif, 
				amount: Number(notif.subscription.amount).toFixed(2),
				month: month_name[notif.subscription.next_billing_date.getMonth()],
				day: String(notif.subscription.next_billing_date.getDate()).padStart(2, 0)
			}))

			let notif_count = 0
			for(let notif of formatted_notifications) {if(notif.is_read === false) notif_count = notif_count + 1}
		
			return{ formatted_notifications, notif_count }
		})
		
		res.status(200).json({ 
			formatted_notifications: result.formatted_notifications, 
			notif_count: result.notif_count 
		})
	} catch (error) {
		console.error('Error retrieving notifications: ', error)
		res.status(500).json({ message: 'Error retrieving notifications.' })
	}
})

// Get notifications of current user today
app.get('/dashboard/notification/today', token_auth, read_limiter, async (req, res) => {
	const month_name = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	
	today_start_string = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z'
	const today_start = new Date(today_start_string)

	today_end_string = new Date().toISOString().split('T')[0] + 'T23:59:59.999Z'
	const today_end = new Date(today_end_string)
	
	const cache_key = `notifications_today:${req.user.id}`
	try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			const notifications = await prisma.notification.findMany({ 
				where: { user_id: req.user.id, notify_at: { gte: today_start, lte: today_end }},
				include: { subscription: true },
				orderBy: { notify_at: 'desc' }
			})

			const formatted_notifications = notifications.map(notif => ({
				...notif, 
				amount: Number(notif.subscription.amount).toFixed(2),
				month: month_name[notif.subscription.next_billing_date.getMonth()],
				day: String(notif.subscription.next_billing_date.getDate()).padStart(2, 0)
			}))

			return { formatted_notifications }
		})

		res.status(200).json({ formatted_notifications: result.formatted_notifications })
	} catch (error) {
		console.error('Error retrieving notifications today: ', error)
		res.status(500).json({ message: 'Error retrieving notifications today.' })
	}
})

// Mark all notifications as read
app.put('/notification/mark_all_as_read', token_auth, write_limiter, async (req, res)=> {
	try {
		await prisma.notification.updateMany({
			where: { user_id: req.user.id, is_read: false },
			data: { is_read: true }
		})

		// Delete cache because the data change
		await delete_cache(`notifications_today:${req.user.id}`)
		await delete_cache(`notifications:${req.user.id}`)

		res.status(200).json({ message: 'Successfully marked all as read' })
	} catch (error) {
		console.log('Error marking all as read: ', error)
		res.status(500).json({ message: 'Error marking all as read.' })
	}
})

// Delete notification of current user
app.delete('/delete/notification', token_auth, write_limiter, async (req, res) => {
	const { notification_id } = req.body
	if(typeof notification_id !== 'string' || notification_id.trim().length === 0) return res.status(400).json({ message: 'Invalid notification.' })  
	try {
		await prisma.notification.delete({ where: { id: notification_id, user_id: req.user.id } })
		
		// Delete cache because the data change
		await delete_cache(`notifications_today:${req.user.id}`)
		await delete_cache(`notifications:${req.user.id}`)

		res.status(200).json({ message: 'Notification deleted successfully.' })
	} catch (error) {res.status(500).json({ message: 'Error deleting notification.' })}
})

// Get monthly spend
app.get('/dashboard/monthly_spend', token_auth, read_limiter, async (req, res) => {
	const cache_key = `monthly_spends:${req.user.id}`
	try {
		const result = await get_or_set_cache(cache_key, 120, async ()=> {
			const data = await prisma.subscription.groupBy({
				where: {user_id: req.user.id},
				by: ['currency'],
				_sum: { amount: true } 
			})
			const monthly_php = data.find(item => item.currency === 'PHP')
			const monthly_usd = data.find(item => item.currency === 'USD')
		
			return { monthly_php, monthly_usd }
		})
		
		res.status(200).json({ 
			monthly_php: Number(result.monthly_php?._sum?.amount / 12 || 0).toFixed(2), 
			monthly_usd: Number(result.monthly_usd?._sum?.amount / 12 || 0).toFixed(2), 
			message: 'monthly_spend retrieved successfully.'
		})
	} catch (error) {
		console.log('error: ', error)
		res.status(500).json({ message: 'Error retrieving monthly spend.' })
	}
})

// Get active subscriptions
app.get('/dashboard/total/active_sub', token_auth, read_limiter, async (req, res) => {
	const cache_key = `total_active_subs:${req.user.id}`
	try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			const data = await prisma.subscription.findMany({ where: { is_active: true, user_id: req.user.id } })
			return { data }
		})

		res.status(200).json({ active_subs: result.data.length, message: 'Active subscriptions retrieved successfully.'})
	} catch (error) {
		console.log('error: ', error)
		res.status(500).json({ message: 'Error retrieving active subscriptions.' })
	}
})

// Get total subs due in a week
app.get('/dashboard/total/due_1_week', token_auth, read_limiter, async (req, res) => {
	// Date today YYYY-MM-DD (Start of day)
	const today = new Date()
	const t_year = today.getFullYear()
	const t_month = String(today.getMonth() + 1).padStart(2, '0')
	const t_day = String(today.getDate()).padStart(2, '0')
	const date_today = `${t_year}-${t_month}-${t_day}T00:00:00.000Z`
	// Date next week YYYY-MM-DD (End of day)
	const next_week = new Date()
	next_week.setDate(next_week.getDate() + 7) 
	const nw_year = next_week.getFullYear()
	const nw_month = String(next_week.getMonth() + 1).padStart(2, '0')
	const nw_day = String(next_week.getDate()).padStart(2, '0')
	const date_next_week = `${nw_year}-${nw_month}-${nw_day}T23:59:59.999Z`

	const cache_key = `total_due_1_week:${req.user.id}:${date_today}:${date_next_week}`
	try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			const data = await prisma.subscription.findMany({
				where: { next_billing_date: { gte: date_today, lte: date_next_week}, user_id: req.user.id}
			})
			return { data }
		})
		
		res.status(200).json({ due_1_week: result.data.length, message: '1 week due subscriptions retrieved successfully.' })
	} catch (error) {
		console.log('error: ', error)
		res.status(500).json({ message: 'Error retrieving 1 week due subscriptions.' })
	}
})

// Get total budget
app.get('/dashboard/total/budget', token_auth, read_limiter, async (req, res) => {
	const cache_key = `total_budget:${req.user.id}`
	try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			const data = await prisma.budget.groupBy({
				where: {user_id: req.user.id},
				by: ['currency'],
				_sum: { amount: true }
			})
			const php = data.find(item => item.currency === 'PHP')
			const usd = data.find(item => item.currency === 'USD')
		
			return { php, usd }
		})
		
		res.status(200).json({
			total_php: Number(result.php?._sum?.amount || 0).toFixed(2),
			total_usd: Number(result.usd?._sum?.amount || 0).toFixed(2),
			message: 'Total budget retrieved successfully.'
		})
	} catch (error) {
		console.log('error: ', error)
      res.status(500).json({ message: 'Error getting total budget.' })
	}
})

// Get budget left this month
app.get('/dashboard/total/budget_left', token_auth, read_limiter, async (req, res) => {
   // Start of month
   const today = new Date();
   const today_year = today.getFullYear();
	const month_index = today.getMonth() + 1
   const month = String(today.getMonth() + 1).padStart(2,'0');
   const start_of_month = `${today_year}-${month}-01T00:00:00.000Z`;
   // Last of month: new Date(year, month, 0) gets the last day of the PREVIOUS month.
   // So passing today.getMonth() + 1 gets the last day of the CURRENT month.
   const last_day_date = new Date(today_year, today.getMonth() + 1, 0);
   const last_day = String(last_day_date.getDate()).padStart(2, '0');
   const end_of_month = `${today_year}-${month}-${last_day}T23:59:59.999Z`;
   
	const cache_key = `total_budget_left:${req.user.id}:${start_of_month}:${end_of_month}`
	try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			// Get total amount of subscriptions this month (Spent)
			const data = await prisma.subscription.groupBy({
				where: { 
					next_billing_date: { gte: start_of_month, lte: end_of_month }, 
					user_id: req.user.id 
				},
				by: ['currency'],
				_sum: { amount: true }
			});

			const php_sub = data.find(item => item.currency === 'PHP');
			const usd_sub = data.find(item => item.currency === 'USD');

			const php_spent = Number((php_sub?._sum?.amount || 0).toFixed(2));
			const usd_spent = Number((usd_sub?._sum?.amount || 0).toFixed(2));

			// Get total budget of this month
			const budgets = await prisma.budget.groupBy({
				where: { month: month_index, year: today_year, user_id: req.user.id},
				by: ['currency'],
				_sum: { amount: true }
			});
			
			const php_budget_obj = budgets.find(item => item.currency === 'PHP');
			const usd_budget_obj = budgets.find(item => item.currency === 'USD');

			// Extract the actual amounts into numbers! (This fixes the React error)
			const php_budget = Number((php_budget_obj?._sum?.amount || 0).toFixed(2));
			const usd_budget = Number((usd_budget_obj?._sum?.amount || 0).toFixed(2));

			// 3. Subtract spent from budget
			const php_left = Number((php_budget - php_spent).toFixed(2));
			const usd_left = Number((usd_budget - usd_spent).toFixed(2));

			const budget = {}
			budget.php_budget = php_budget
			budget.php_spent = php_spent
			budget.php_left = php_left
			budget.usd_budget = usd_budget
			budget.usd_spent = usd_spent
			budget.usd_left = usd_left
		
			return { budget }
		})
      
      res.status(200).json({ budget: result.budget, message: 'Remaining monthly budget calculated successfully.' });
   } catch (error) {
      console.log('error: ', error);
      res.status(500).json({ message: 'Error calculating monthly budget.' });
   }
});

// Get upcoming renewals
app.get('/dashboard/renewals', token_auth, read_limiter, async (req, res) => {
	// Date today YYYY-MM-DD (Start of day)
	const today = new Date()
	const t_year = today.getFullYear()
	const t_month = String(today.getMonth() + 1).padStart(2, '0')
	const t_day = String(today.getDate()).padStart(2, '0')
	const date_today = `${t_year}-${t_month}-${t_day}T00:00:00.000Z`
	// Date next 3 days YYYY-MM-DD (End of day)
	const next_3 = new Date()
	next_3.setDate(next_3.getDate() + 3) 
	const n3_year = next_3.getFullYear()
	const n3_month = String(next_3.getMonth() + 1).padStart(2, '0')
	const n3_day = String(next_3.getDate()).padStart(2, '0')
	const date_next_3 = `${n3_year}-${n3_month}-${n3_day}T23:59:59.999Z`

	const month_name = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	
	const cache_key = `renewals:${req.user.id}:${date_today}:${date_next_3}`
	try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			const renewals = await prisma.subscription.findMany({
				where: { 
					next_billing_date: { gte: date_today, lte: date_next_3 }, 
					user_id: req.user.id 
				},
				include: {category: {select: {color_hex: true } } }
			})
			const formatted_renewals = renewals.map(renewal => ({
				...renewal, 
				amount: Number(renewal.amount).toFixed(2),
				month: month_name[renewal.next_billing_date.getMonth()],
				day: String(renewal.next_billing_date.getDate()).padStart(2, 0)
			}))
		
			return { formatted_renewals }
		})

		res.status(200).json({formatted_renewals: result.formatted_renewals, message: 'Upcoming renewals retrieved successfully.'})
	} catch (error) {
      console.log('error: ', error)
      res.status(500).json({ message: 'Error fetching upcoming renewals.' })
   }
})


// Get active expenses by category
app.post('/dashboard/category_spent', token_auth, write_limiter, async (req, res) => {
   const { toggle } = req.body

   if (!toggle) return res.status(400).json({ message: 'Currency is required.' })
	if(typeof toggle !== 'string' || toggle.trim().length === 0) return res.status(400).json({ message: 'Invalid currency.' })  

	// Start of month
   const today = new Date();
   const today_year = today.getFullYear();
	const month_index = today.getMonth() + 1
   const month = String(today.getMonth() + 1).padStart(2,'0');
   const start_of_month = `${today_year}-${month}-01T00:00:00.000Z`;
   // Last of month: new Date(year, month, 0) gets the last day of the PREVIOUS month.
   // So passing today.getMonth() + 1 gets the last day of the CURRENT month.
   const last_day_date = new Date(today_year, today.getMonth() + 1, 0);
   const last_day = String(last_day_date.getDate()).padStart(2, '0');
   const end_of_month = `${today_year}-${month}-${last_day}T23:59:59.999Z`;
	
	const cache_key = `category_spent:${req.user.id}:${toggle}`
   try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			// Get subscriptions total amount by category (active only)
			const grouped_spent = await prisma.subscription.groupBy({
				by: ['category_id'],
				where: {
					currency: toggle,
					user_id: req.user.id,
					category_id: { not: null },
					is_active: true,
					next_billing_date: { gte: start_of_month, lte: end_of_month }
				},
				_sum: { amount: true }
			})
			// Get categories of spent
			const category_ids = grouped_spent.map(spent => spent.category_id)
			const categories = await prisma.category.findMany({
				where: { id: { in: category_ids }, user_id: req.user.id },
				select: { id: true, name: true, color_hex: true }
			})
			// Get budget of this month
			const budgets = await prisma.budget.findMany({
				where: {
					currency: toggle,
					month: month_index,
					year: today_year,
					user_id: req.user.id,
					category_id: { in: category_ids }
				}
			})
			// Combine
			const spent_category = grouped_spent.map(group => {
				const category_data = categories.find(c => c.id === group.category_id) || { name: 'Unknown', color_hex: '#ccc' }
				const budget_match = budgets.find(b => b.category_id === group.category_id)
				return {
					category_id: group.category_id,
					total_amount: Number(group._sum.amount || 0).toFixed(2),
					category_name: category_data.name,
					category_hex: category_data.color_hex,
					category_budget: Number(budget_match?.amount || 0).toFixed(2)
				}
			})
		
			return { spent_category }
		})
      res.status(200).json({ spent_category: result.spent_category, message: 'Spent by category retrieved successfully.' })
   } catch (error) {
      console.log('error: ', error)
      res.status(500).json({ message: 'Error fetching category spent.' })
   }
})

// Get categories with total count and amount of subs
app.get('/category/category_summary', token_auth, read_limiter, async (req, res) => {
	const cache_key = `category_summary:${req.user.id}`
	try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			const categories = await prisma.category.findMany({ 
				where: { user_id: req.user.id },
				include: { subscriptions: true }
			})
			const category_ids = categories.map(cat => cat.id)
			const category_amount = await prisma.subscription.groupBy({
				by: ['category_id', 'currency'],
				where: { user_id: req.user.id, category_id: { in: category_ids } },
				_sum: { amount: true }
			})
			const category_summary = categories.map(cat => {
				const php_cat_amount = category_amount.find(cat_amount => cat_amount.category_id === cat.id && cat_amount.currency === 'PHP')
				const usd_cat_amount = category_amount.find(cat_amount => cat_amount.category_id === cat.id && cat_amount.currency === 'USD')
				return {
					id: cat.id,
					name: cat.name,
					color_hex: cat.color_hex,
					subs_count: cat.subscriptions.length,
					php_sub_amount: Number(php_cat_amount?._sum?.amount || 0).toFixed(2),
					usd_sub_amount: Number(usd_cat_amount?._sum?.amount || 0).toFixed(2),

				}
			})

			return { category_summary }
		})
		
		res.status(200).json({ category_summary: result.category_summary, message: 'Category summary retrieved successfully' })
	} catch (error) {
      console.log('error: ', error)
      res.status(500).json({ message: 'Error fetching category summary.' })
   }
})

// Get total budget with expenses
app.post('/budget/budget_summary', token_auth, write_limiter, async (req, res)=> {
	const { toggle, input_month_index, input_year } = req.body
	if(typeof toggle !== 'string' || toggle.trim().length === 0) return res.status(400).json({ message: 'Invalid currency.' })  
	if(typeof input_month_index !== 'number' || input_month_index.length === 0) return res.status(400).json({ message: 'Invalid month.' })  
	if(typeof input_year !== 'number' || input_year.length === 0) return res.status(400).json({ message: 'Invalid year.' })  

	const date = new Date()
	// Create strings for the ISO date (e.g., "08")
   const current_month_str = String(input_month_index + 1).padStart(2, '0');
   const start_of_month = `${input_year}-${current_month_str}-01T00:00:00.000Z`;
   // Last of month: new Date(year, month, 0) gets the last day of the PREVIOUS month.
   const last_day_date = new Date(input_year, input_month_index + 1, 0);
   const last_day = String(last_day_date.getDate()).padStart(2, '0');
   const end_of_month = `${input_year}-${current_month_str}-${last_day}T23:59:59.999Z`;

	const cache_key = `budget_summary:${req.user.id}:${toggle}:${start_of_month}:${end_of_month}`
	try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			const budget = await prisma.budget.aggregate({
				where: { month: input_month_index + 1, year: input_year, currency: toggle, user_id: req.user.id },
				_sum: { amount: true }
			})
			const subs_total = await prisma.subscription.aggregate({
				where: { currency: toggle, user_id: req.user.id, next_billing_date: { gte: start_of_month, lte: end_of_month } },
				_sum: { amount: true }
			})
			const budget_summary = {}
			budget_summary.budget = Number(budget._sum.amount || 0).toFixed(2)
			budget_summary.subs_total = Number(subs_total._sum.amount || 0).toFixed(2)
		
			return { budget_summary }
		})

		res.status(200).json({ budget_summary: result.budget_summary, message: 'Budget summary retrieved successfully'})
	} catch (error) {
      console.log('error: ', error)
      res.status(500).json({ message: 'Error fetching budget summary.' })
   }
})

// Get categories, budget, and subs amount based on month
app.post('/budget/category_budget', token_auth, write_limiter, async (req, res)=> {
	const { toggle, input_month_index, input_year } = req.body

	if(typeof toggle !== 'string' || toggle.trim().length === 0) return res.status(400).json({ message: 'Invalid currency.' })  
	if(typeof input_month_index !== 'number' || input_month_index.length === 0) return res.status(400).json({ message: 'Invalid month.' })  
	if(typeof input_year !== 'number' || input_year.length === 0) return res.status(400).json({ message: 'Invalid year.' })  

	const date = new Date()
	// Create strings for the ISO date (e.g., "08")
   const current_month_str = String(input_month_index + 1).padStart(2, '0');
   const start_of_month = `${input_year}-${current_month_str}-01T00:00:00.000Z`;
   // Last of month: new Date(year, month, 0) gets the last day of the PREVIOUS month.
   const last_day_date = new Date(input_year, input_month_index + 1, 0);
   const last_day = String(last_day_date.getDate()).padStart(2, '0');
   const end_of_month = `${input_year}-${current_month_str}-${last_day}T23:59:59.999Z`;

	const cache_key = `category_budget:${req.user.id}:${toggle}:${start_of_month}:${end_of_month}`
	try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			const categories = await prisma.category.findMany({ where: { user_id: req.user.id } })
			const budgets = await prisma.budget.groupBy({
				by: ['id','category_id'],
				where: { user_id: req.user.id, currency: toggle, month: input_month_index + 1, year: input_year },
				_sum: { amount: true }
			})
			const subscriptions = await prisma.subscription.groupBy({
				by: ['category_id'],
				where: { currency: toggle, user_id: req.user.id, next_billing_date: { gte: start_of_month, lte: end_of_month } },
				_sum: { amount: true }
			})
			// Combine
			const categories_budgets = categories.map(cat => {
				const subscription_match = subscriptions.find(sub => sub.category_id === cat.id)
				const budget_match = budgets.find(bud => bud.category_id === cat.id)
				const budget_amount = Number(budget_match?._sum?.amount || 0).toFixed(2)
				const subscription_amount = Number(subscription_match?._sum?.amount || 0).toFixed(2)
				return {
					id: cat.id,
					budget_id: budget_match?.id || null,
					name: cat.name,
					color_hex: cat.color_hex,
					budget: Number(budget_match?._sum?.amount || 0).toFixed(2),
					amount: Number(subscription_match?._sum?.amount || 0).toFixed(2),
					color_hex: cat.color_hex,
					left: Number(budget_amount - subscription_amount < 0 ? 0 : budget_amount - subscription_amount).toFixed(2)
				}
			})
		
			return { categories_budgets }
		})

		res.status(200).json({ categories_budgets: result.categories_budgets, message: 'Categories budgets retrieved successfully' })
	} catch (error) {
      console.log('error: ', error)
      res.status(500).json({ message: 'Error fetching categories with budget.' })
   }
})

