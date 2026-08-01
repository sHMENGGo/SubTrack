const { PrismaClient } = require('./prisma/generated/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookie_parser = require('cookie-parser')
require('dotenv').config()
require('./notif_automation') // Import the notification automation script

// Prisma 
const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL})
const prisma = new PrismaClient({ adapter })

// Middleware
const app = express()
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookie_parser())
const PORT = process.env.PORT

// Health Check Route
app.get('/', (req, res) => {res.status(200).json({ message: 'Express backend is live and routing!' })})

// Start Server
app.listen(PORT, () => {console.log(`Server is running on http://localhost:${PORT}`)})

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

// =============================== Routes =======================================

// Check if currently logged in
app.get('/me', token_auth, async (req, res)=>{res.status(200).json({id: req.user.id, name: req.user.name})})

// Login route
app.post('/login', async (req, res) => {
	const { email, password, remember_me } = req.body
	try {
		const user = await prisma.user.findUnique({ where: { email: email } })
		if (!user || user.password !== password) {return res.status(401).json({ message: 'Invalid email or password.' })}
		const token = jwt.sign({ id: user.id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '30d' })
		
		res.cookie('token', token, { 
			httpOnly: true, 
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			...(remember_me && { maxAge: 30 * 24 * 60 * 60 * 1000 }) // 30 days in milliseconds
		})
		
		res.status(200).json({ message: 'Login successful!' })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Error occurred while logging in.' })}
})

// Logout route
app.get('/logout', token_auth, (req, res) => {
	try {
		res.clearCookie('token', {
			httpOnly: true, 
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict'
		})
		res.status(200).json({ message: 'Logout successful!' })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Error occurred while logging out.' })
	}
})

// Register route
app.get('/register', async (req, res) => {
   const { reg_name, reg_password, reg_email } = req.body
   try {
      await prisma.user.create({data: {
        	name: reg_name, 
        	password: reg_password, 
        	email: reg_email}})
      res.status(201).json({ message: 'Account registered successfully!', success:true })
   } catch (error) {res.status(500).json({ message: 'Error registering user!' })}
})

// Get subscription of current user
app.get('/subscription', token_auth, async (req, res) => {
	try {
		const subscriptions = await prisma.subscription.findMany({ where: { user_id: req.user.id } })
		res.status(200).json({ subscriptions })
	} catch (error) {res.status(500).json({ message: 'Error retrieving subscriptions.' })}
})

// Add subscription for current user
app.post('/add/subscription', token_auth, async (req, res) => {
	const { sub_name, sub_amount, billing_date, sub_category_id, sub_duration } = req.body
	const date = new Date(billing_date)
	switch (sub_duration) {
		case 'daily': date.setDate(date.getDate() + 1); break
		case 'weekly': date.setDate(date.getDate() + 7); break
		case 'monthly': date.setMonth(date.getMonth() + 1);break
		case 'yearly': date.setFullYear(date.getFullYear() + 1); break
	}
	// Format the date to YYYY-MM-DD
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	const date_string = `${year}-${month}-${day}T00:00:00.000Z` // This will set the time to midnight UTC to satisfy js and prisma
	try {
		await prisma.subscription.create({ data: {
			name: sub_name,
			amount: sub_amount,
			next_billing_date: date_string,
			user_id: req.user.id,
			category_id: sub_category_id
		} })
		res.status(201).json({ message: 'Subscription added successfully.' })
	} catch (error) {res.status(500).json({ message: 'Error adding subscription.' })}
})

// Edit subscription of current user
app.put('/edit/subscription', token_auth, async (req, res) => {
	const { sub_id, new_sub_name, new_sub_amount, new_billing_date, new_sub_category_id, new_sub_duration } = req.body 
	const new_date = new Date(new_billing_date)
	switch (new_sub_duration) {
		case 'daily': new_date.setDate(new_date.getDate() + 1); break
		case 'weekly': new_date.setDate(new_date.getDate() + 7); break
		case 'monthly': new_date.setMonth(new_date.getMonth() + 1);break
		case 'yearly': new_date.setFullYear(new_date.getFullYear() + 1); break
	}
	// Add UTC time to the date to satisfy js and prisma
	const new_formatted_date = `${new_date}T00:00:00.000Z`
	// Only accepts input that is not undefined or null
	const update_data = {}
	if(new_sub_name !== undefined && new_sub_name !== null) {update_data.name = new_sub_name}
	if(new_sub_amount !== undefined && new_sub_amount !== null) {update_data.amount = new_sub_amount}
	if(new_billing_date !== undefined && new_billing_date !== null) {update_data.next_billing_date = new_formatted_date}
	if(new_sub_category_id !== undefined && new_sub_category_id !== null) {update_data.category_id = new_sub_category_id}

	try {
		await prisma.subscription.update({ 
			where: { id: sub_id, user_id: req.user.id }, 
			data: { update_data } })
		res.status(200).json({ message: 'Subscription updated successfully.' })
	} catch (error) {res.status(500).json({ message: 'Error updating subscription.' })}
})

// Delete subscription of current user
app.delete('/delete/subscription', token_auth, async (req, res) => {
	const { subscription_id } = req.body
	try {
		await prisma.subscription.delete({ where: { id: subscription_id, user_id: req.user.id } })
		res.status(200).json({ message: 'Subscription deleted successfully.' })
	} catch (error) {res.status(500).json({ message: 'Error deleting subscription.' })}
})

// Get categories of current user
app.get('/category', token_auth, async (req, res) => {
	try {
		const categories = await prisma.category.findMany({ where: { user_id: req.user.id } })
		res.status(200).json({ categories })
	} catch (error) {res.status(500).json({ message: 'Error retrieving categories.' })}
})

// Add category for current user
app.post('/add/category', token_auth, async (req, res) => {
	const { category_name, category_color } = req.body
	try {
		await prisma.category.create({ data: {
			name: category_name,
			color_hex: category_color,
			user_id: req.user.id
		} })
		res.status(201).json({ message: 'Category added successfully.' })
	} catch (error) {res.status(500).json({ message: 'Error adding category.' })}
})

// Edit category of current user
app.put('/edit/category', token_auth, async (req, res) => {
	const { category_id, new_category_name, new_category_color } = req.body
	try {
		await prisma.category.update({ 
			where: { id: category_id, user_id: req.user.id }, 
			data: { 
				name: new_category_name,
				color_hex: new_category_color
			} 
		})
		res.status(200).json({ message: 'Category updated successfully.' })
	} catch (error) {res.status(500).json({ message: 'Error updating category.' })}
})

// Delete category of current user
app.delete('/delete/category', token_auth, async (req, res) => {
	const { category_id } = req.body
	try {
		await prisma.category.delete({ where: { id: category_id, user_id: req.user.id } })
		res.status(200).json({ message: 'Category deleted successfully.' })
	} catch (error) {res.status(500).json({ message: 'Error deleting category.' })}
})

// Get budget of current user
app.get('/budget', token_auth, async (req, res) => {
	try {
		const budgets = await prisma.budget.findMany({ where: { user_id: req.user.id } })
		res.status(200).json({ budgets })
	} catch (error) {res.status(500).json({ message: 'Error retrieving budgets.' })}
})

// Add budget for current user
app.post('/add/budget', token_auth, async (req, res) => {
	const { budget_amount, budget_category_id, budget_month, budget_year } = req.body
	// Check if category is not null
	const have_budget_category_id = {}
	if(budget_category_id !== undefined || budget_category_id !== null) have_budget_category_id = budget_category_id
	try {
		await prisma.budget.create({ data: {
			amount: budget_amount,
			category_id: have_budget_category_id,
			month: budget_month,
			year: budget_year,
			user_id: req.user.id
		} })
		res.status(201).json({ message: 'Budget added successfully.' })
	} catch (error) {res.status(500).json({ message: 'Error adding budget.' })}
})

// Edit budget of current user
app.put('/edit/budget', token_auth, async (req, res) => {
	const { budget_id, new_budget_amount, new_budget_category_id, new_budget_month, new_budget_year } = req.body
	const update_data = {}
	if(new_budget_amount !== undefined || new_budget_amount !== null) update_data.amount = new_budget_amount
	if(new_budget_category_id !== undefined || new_budget_category_id !== null) update_data.category_id = new_budget_category_id
	if(new_budget_month !== undefined || new_budget_month !== null) update_data.month = new_budget_month
	if(new_budget_year !== undefined || new_budget_year !== null) update_data.year = new_budget_year
	try {
		await prisma.budget.update({ 
			where: { id: budget_id, user_id: req.user.id },
			data: { update_data } 
		})
		res.status(200).json({ message: 'Budget updated successfully.' })
	} catch (error) {res.status(500).json({ message: 'Error updating budget.' })}
})

// Delete budget of current user
app.delete('/delete/budget', token_auth, async (req, res) => {
	const { budget_id } = req.body
	try {
		await prisma.budget.delete({ where: { id: budget_id, user_id: req.user.id } })
		res.status(200).json({ message: 'Budget deleted successfully.' })
	} catch (error) {res.status(500).json({ message: 'Error deleting budget.' })}
})

// Get subscription history of current user
app.get('/history', token_auth, async (req, res) => {
	try {
		const histories = await prisma.subscriptionHistory.findMany({ where: { user_id: req.user.id } })
		res.status(200).json({ histories })
	} catch (error) {res.status(500).json({ message: 'Error retrieving subscription history.' })}
})

// Get notifications of current user
app.get('/notification', token_auth, async (req, res) => {
	try {
		const notifications = await prisma.notification.findMany({ where: { user_id: req.user.id, is_read: false } })
		res.status(200).json({ notifications })
	} catch (error) {res.status(500).json({ message: 'Error retrieving notifications.' })}
})

// Delete notification of current user
app.delete('/delete/notification', token_auth, async (req, res) => {
	const { notification_id } = req.body
	try {
		await prisma.notification.delete({ where: { id: notification_id, user_id: req.user.id } })
		res.status(200).json({ message: 'Notification deleted successfully.' })
	} catch (error) {res.status(500).json({ message: 'Error deleting notification.' })}
})

// Get monthly spend
app.get('/monthly_spend', token_auth, async (req, res) => {
	try {
		const data = await prisma.subscription.groupBy({
			where: {user_id: req.user.id},
			by: ['currency'],
			_sum: { amount: true } 
		})
		const monthly_php = data.find(item => item.currency === 'PHP')
		const monthly_usd = data.find(item => item.currency === 'USD')
		res.status(200).json({ 
			monthly_php: Number(monthly_php?._sum?.amount / 12 || 0).toFixed(2), 
			monthly_usd: Number(monthly_usd?._sum?.amount / 12 || 0).toFixed(2), 
			message: 'monthly_spend retrieved successfully.'
		})
	} catch (error) {
		console.log('error: ', error)
		res.status(500).json({ message: 'Error retrieving monthly spend.' })
	}
})

// Get active subscriptions
app.get('/total/active_sub', token_auth, async (req, res) => {
	try {
		const data = await prisma.subscription.findMany({ where: { is_active: true, user_id: req.user.id } })
		res.status(200).json({ active_subs: data.length, message: 'Active subscriptions retrieved successfully.'})
	} catch (error) {
		console.log('error: ', error)
		res.status(500).json({ message: 'Error retrieving active subscriptions.' })
	}
})

// Get total subs due in a week
app.get('/total/due_1_week', token_auth, async (req, res) => {
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

	try {
		const data = await prisma.subscription.findMany({
			where: { next_billing_date: { gte: date_today, lte: date_next_week}, user_id: req.user.id}
		})
		res.status(200).json({ due_1_week: data.length, message: '1 week due subscriptions retrieved successfully.' })
	} catch (error) {
		console.log('error: ', error)
		res.status(500).json({ message: 'Error retrieving 1 week due subscriptions.' })
	}
})

// Get total budget
app.get('/total/budget', token_auth, async (req, res) => {
	try {
		const data = await prisma.budget.groupBy({
			where: {user_id: req.user.id},
			by: ['currency'],
			_sum: { amount: true }
		})
		const php = data.find(item => item.currency === 'PHP')
		const usd = data.find(item => item.currency === 'USD')
		res.status(200).json({
			total_php: Number(php?._sum?.amount || 0).toFixed(2),
			total_usd: Number(usd?._sum?.amount || 0).toFixed(2),
			message: 'Total budget retrieved successfully.'
		})
	} catch (error) {
		console.log('error: ', error)
      res.status(500).json({ message: 'Error getting total budget.' })
	}
})

// Get budget left this month
app.get('/total/budget_left', token_auth, async (req, res) => {
   // Start of month
   const today = new Date();
   const today_year = today.getFullYear();
   const month_index = today.getMonth() + 1; // 1 to 12 (e.g., August = 8)
   
   // Create strings for the ISO date (e.g., "08")
   const current_month_str = String(month_index).padStart(2, '0');
   const start_of_month = `${today_year}-${current_month_str}-01T00:00:00.000Z`;
   
   // Last of month: new Date(year, month, 0) gets the last day of the PREVIOUS month.
   // So passing today.getMonth() + 1 gets the last day of the CURRENT month.
   const last_day_date = new Date(today_year, today.getMonth() + 1, 0);
   const last_day = String(last_day_date.getDate()).padStart(2, '0');
   const end_of_month = `${today_year}-${current_month_str}-${last_day}T23:59:59.999Z`;

   try {
      // 1. Get Subscriptions (Spent)
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

      // 2. Get Budget
      const budget = await prisma.budget.groupBy({
         where: { month: month_index, year: today_year, user_id: req.user.id},
         by: ['currency'],
         _sum: { amount: true }
      });
      
      const php_budget_obj = budget.find(item => item.currency === 'PHP');
      const usd_budget_obj = budget.find(item => item.currency === 'USD');

      // Extract the actual amounts into numbers! (This fixes the React error)
      const php_budget = Number((php_budget_obj?._sum?.amount || 0).toFixed(2));
      const usd_budget = Number((usd_budget_obj?._sum?.amount || 0).toFixed(2));

      // 3. Subtract spent from budget
      const php_left = Number((php_budget - php_spent).toFixed(2));
      const usd_left = Number((usd_budget - usd_spent).toFixed(2));

      // Send flat numbers back to the React frontend
      res.status(200).json({
         php_budget, // Now this is a number (e.g., 5000) instead of an object
         usd_budget, 
         php_spent,
         usd_spent,
         php_left,
         usd_left,
         message: 'Remaining monthly budget calculated successfully.'
      });
      
   } catch (error) {
      console.log('error: ', error);
      res.status(500).json({ message: 'Error calculating monthly budget.' });
   }
});

// Get upcoming renewals
app.get('/renewals', token_auth, async (req, res) => {
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
	try {
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
		res.status(200).json({formatted_renewals, message: 'Upcoming renewals retrieved successfully.'})
	} catch (error) {
      console.log('error: ', error)
      res.status(500).json({ message: 'Error fetching upcoming renewals.' })
   }
})

// Get spent by category
app.post('/category_spent', token_auth, async (req, res) => {
   const { money } = req.body
   if (!money) return res.status(400).json({ message: 'Currency is required.' })
   try {
      // Get subscriptions spent (active only)
      const grouped_spent = await prisma.subscription.groupBy({
         by: ['category_id'],
         where: {
            currency: money,
            user_id: req.user.id,
            category_id: { not: null },
            is_active: true
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
      const today = new Date()
      const today_year = today.getFullYear()
      const month_index = today.getMonth() + 1
      const budgets = await prisma.budget.findMany({
         where: {
            currency: money,
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
         const category_budget = budget_match ? Number(budget_match.amount || 0) : 0
         return {
            category_id: group.category_id,
            total_amount: Number(group._sum.amount || 0).toFixed(2),
            category_name: category_data.name,
            category_hex: category_data.color_hex,
            category_budget: Number(category_budget).toFixed(2)
         }
      })
      res.status(200).json({ spent_category, message: 'Spent by category retrieved successfully.' })
   } catch (error) {
      console.log('error: ', error)
      res.status(500).json({ message: 'Error fetching category spent.' })
   }
})