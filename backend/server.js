const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
require('dotenv').config()
require('./notif_automation') // Import the notification automation script

// Prisma 
const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL})
const prisma = new PrismaClient({ adapter })

// Middleware
const app = express()
app.use(cors())
app.use(express.json())
const PORT = process.env.PORT

// Health Check Route
app.get('/', (req, res) => {res.status(200).json({ message: 'Express backend is live and routing!' })})

// Start Server
app.listen(PORT, () => {console.log(`Server is running on http://localhost:${PORT}`)})

// Token authentication function
const token_auth = (req, res, next) => {
	const token = req.headers.authorization?.split(' ')[1]
	if (!token) {return res.status(401).json({ message: 'Access denied. No token provided.' })}
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET)
		req.user = decoded
		next()
	} catch (error) {res.status(400).json({ message: 'Invalid token.' })}
}

// Login route
app.get('/login', async (req, res) => {
	const { username, password } = req.body
	try {
		const user = await prisma.user.findUnique({ where: { username } })
		if (!user || user.password !== password) {return res.status(401).json({ message: 'Invalid username or password.' })}
		const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' })
		res.status(200).json({ message: 'Login successful!', token })
	} catch (error) {res.status(500).json({ message: 'Error occurred while logging in.' })}
})

// Register route
app.get('/register', async (req, res) => {
   const { reg_username, reg_password, reg_email } = req.body
   try {
      await prisma.user.create({data: {
        	username: reg_username, 
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
		const notifications = await prisma.notification.findMany({ where: { user_id: req.user.id } })
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


