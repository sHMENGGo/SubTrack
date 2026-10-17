require('dotenv').config()
const { PrismaClient } = require('./prisma/generated/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookie_parser = require('cookie-parser')
const { login_limiter, register_limiter, two_fa_limiter, read_limiter, write_limiter } = require('./utils/rate_limit')
const bcrypt = require('bcrypt')
const { token_auth } = require('./utils/token_auth')
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
const PORT = process.env.PORT

// Health Check Route
app.get('/', (req, res) => {res.status(200).json({ message: 'Express backend is live and routing!' })})

// Server port
app.listen(PORT, '0.0.0.0', () => {console.log(`Server is running`)})

// Route that github actions call to run daily_automation.js
const { run_daily_job } = require('./utils/daily_automation')
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

// Check if currently logged in
app.get('/me', token_auth, read_limiter, async (req, res)=>{res.status(200).json({id: req.user.id, name: req.user.name})})

// Login route
const { login } = require('./services/user/login')
app.post('/login', login_limiter, (req, res)=> login(req, res, prisma))

// Logout route
const { logout } = require('./services/user/logout')
app.get('/logout', token_auth, read_limiter, (req, res) => logout(req, res))

// Register, send verification code
const { register, register_verify } = require('./services/user/register_account')
app.post('/register/send_code', register_limiter, (req, res) => register(req, res, prisma))

// Register, verify code
app.post('/register/verify_code', two_fa_limiter, async (req, res) => register_verify(req, res, prisma))

// Forgot password, send code
const { recover, recover_verify } = require('./services/user/recover_account')
app.post('/recover/send_code', register_limiter, async (req, res) => recover(req, res, prisma))

// Forgot password, verify code
app.put('/recover/verify_code', two_fa_limiter, async (req, res) => recover_verify(req, res, prisma))

// Get profile
const profile = require('./services/profile/get')
app.get('/profile', token_auth, read_limiter, async (req, res) => profile(req, res, prisma))

// Edit profile name
const profile_edit_name = require('./services/profile/edit_name')
app.put('/profile/edit/name', token_auth, write_limiter, async (req, res) => profile_edit_name(req, res, prisma))

// Edit profile password, send code
const profile_edit_password = require('./services/profile/edit_password')
app.post('/profile/edit/password/send_code', token_auth, write_limiter, async (req, res) => profile_edit_password(req, res, prisma))

// Edit profile password, verify code
const profile_edit_password_verify = require('./services/profile/edit_password_verify')
app.put('/profile/edit/password/verify_code', token_auth, write_limiter, async (req, res) => profile_edit_password_verify(req, res, prisma))

// Edit profile email, send code
const profile_edit_email = require('./services/profile/edit_email')
app.put('/profile/edit/email/send_code', token_auth, write_limiter, async (req, res) => profile_edit_email(req, res, prisma))

// Edit profile email, verify code
const profile_edit_email_verify = require('./services/profile/edit_email_verify')
app.put('/profile/edit/email/verify_code', token_auth, write_limiter, async (req, res) => profile_edit_email_verify(req, res, prisma))

// Get subscription of current user
const get_subscription = require('./services/subscription/get')
app.post('/subscription', token_auth, read_limiter, async (req, res) => get_subscription(req, res, prisma))

// Add subscription for current user
const add_subscription = require('./services/subscription/add')
app.post('/subscription/add', token_auth, write_limiter, async (req, res) => add_subscription(req, res, prisma))

// Edit subscription of current user
const edit_subscription = require('./services/subscription/edit')
app.put('/subscription/edit', token_auth, write_limiter, async (req, res) => edit_subscription(req, res, prisma))

// Delete subscription of current user
const delete_subscription = require('./services/subscription/delete')
app.delete('/subscription/delete', token_auth, write_limiter, async (req, res) => delete_subscription(req, res, prisma))

// Get categories of current user
const category = require('./services/category/get')
app.get('/category', token_auth, read_limiter, async (req, res) => category(req, res, prisma))

// Add category for current user
const add_category = require('./services/category/add')
app.post('/add/category', token_auth, write_limiter, async (req, res) => add_category(req, res, prisma))

// Edit category of current user
const edit_category = require('./services/category/edit')
app.put('/edit/category', token_auth, write_limiter, async (req, res) => edit_category(req, res, prisma))

// Delete category of current user
const delete_category = require('./services/category/delete')
app.delete('/delete/category', token_auth, write_limiter, async (req, res) => delete_category(req, res, prisma))

// Get budget of current user
const budget = require('./services/budget/get')
app.get('/budget', token_auth, read_limiter, async (req, res) => budget(req, res, prisma))

// Add budget for current user
const add_budget = require('./services/budget/add')
app.post('/budget/add', token_auth, write_limiter, async (req, res) => add_budget(req, res, prisma))

// Edit budget of current user
const edit_budget = require('./services/budget/edit')
app.put('/budget/edit', token_auth, write_limiter, async (req, res) => edit_budget(req, res, prisma))

// Delete budget of current user
const delete_budget = require('./services/budget/delete')
app.delete('/budget/delete', token_auth, write_limiter, async (req, res) => delete_budget(req, res, prisma))

// Get subscription history of current user
const history = require('./services/history')
app.post('/history', token_auth, read_limiter, async (req, res) => history(req, res, prisma))

// Get notifications of current user
const notification = require('./services/notification/get')
app.get('/notification', token_auth, read_limiter, async (req, res) => notification(req, res, prisma))

// Get notifications of current user today
const notification_today = require('./services/dashboard/notification_today')
app.get('/dashboard/notification/today', token_auth, read_limiter, async (req, res) => notification_today(req, res, prisma))

// Mark all notifications as read
const notification_mark_all_as_read = require('./services/notification/mark_all_as_read')
app.put('/notification/mark_all_as_read', token_auth, write_limiter, async (req, res)=> notification_mark_all_as_read(req, res, prisma))

// Delete notification of current user
const delete_notification = require('./services/notification/delete')
app.delete('/delete/notification', token_auth, write_limiter, async (req, res) => delete_notification(req, res, prisma))

// Get monthly spend
const dashboard_monthly_spend = require('./services/dashboard/monthly_spend')
app.get('/dashboard/monthly_spend', token_auth, read_limiter, async (req, res) => dashboard_monthly_spend(req, res, prisma))

// Get total active subscriptions
const dashboard_total_active_sub = require('./services/dashboard/total_active_subs')
app.get('/dashboard/total/active_sub', token_auth, read_limiter, async (req, res) => dashboard_total_active_sub(req, res, prisma))

// Get total subs due in a week
const dashboard_total_subs_due_1_week = require('./services/dashboard/total_subs_due_1_week')
app.get('/dashboard/total/due_1_week', token_auth, read_limiter, async (req, res) => dashboard_total_subs_due_1_week(req, res, prisma))

// Get total budget
const dashboard_total_budget = require('./services/dashboard/total_budget')
app.get('/dashboard/total/budget', token_auth, read_limiter, async (req, res) => dashboard_total_budget(req, res, prisma))

// Get budget left this month
const dashboard_month_budget_left = require('./services/dashboard/month_budget_left')
app.get('/dashboard/total/month_budget_left', token_auth, read_limiter, async (req, res) => dashboard_month_budget_left(req, res, prisma));

// Get upcoming renewals
const dashboard_renewals = require('./services/dashboard/renewals')
app.get('/dashboard/renewals', token_auth, read_limiter, async (req, res) => dashboard_renewals(req, res, prisma))


// Get this month active expenses by category
const dashboard_category_spent = require('./services/dashboard/category_spent')
app.post('/dashboard/category_spent', token_auth, read_limiter, async (req, res) => dashboard_category_spent(req, res, prisma))

// Get categories with total count and amount of subs
const category_summary = require('./services/category/summary')
app.get('/category/summary', token_auth, read_limiter, async (req, res) => category_summary(req, res, prisma))

// Get total budget with expenses
const budget_summary = require('./services/budget/summary')
app.post('/budget/summary', token_auth, read_limiter, async (req, res)=> budget_summary(req, res, prisma))

// Get categories, budget, and subs amount based on month
const budget_per_category = require('./services/budget/per_category')
app.post('/budget/per_category', token_auth, read_limiter, async (req, res)=> budget_per_category(req, res, prisma))

