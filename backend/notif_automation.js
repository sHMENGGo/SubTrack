const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
require('dotenv').config()
const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL})
const prisma = new PrismaClient({ adapter })

const cron = require('node-cron')

// Function to check for subscriptions every day at 8 AM that are 3 days away from billing
cron.schedule('0 8 * * *', async () => {
   console.log("Running subscription check, 3 days due date...")
   try {
   // Calculate the date exactly 3 days from right now
   const target_date = new Date()
   target_date.setDate(target_date.getDate() + 3)
   console.log("Target date for 3 days due date:", target_date)
   const year = target_date.getFullYear()
   const month = String(target_date.getMonth() + 1).padStart(2, '0') // Months are zero-indexed
   const day = String(target_date.getDate()).padStart(2, '0')
   const date_string = `${year}-${month}-${day}T00:00:00.000Z`
   // Find all active subscriptions billing on that exact day
   const upcoming_subscriptions_3days = await prisma.subscription.findMany({
      where: {
         is_active: true,
         next_billing_date: {equals: date_string}
      }
   })
   // Generate a Notification record for each one found
   for (const sub of upcoming_subscriptions_3days) {
      await prisma.notification.create({
         data: {
            user_id: sub.user_id,
            subscription_id: sub.id,
            type: 'THREE_DAYS_BEFORE',
            message: `${sub.name} will charge ${sub.currency} ${sub.amount} in 3 days.`,
            notify_at: new Date(),
            is_read: false
         }
      })
   }
   console.log(`Generated ${upcoming_subscriptions_3days.length} notifications for 3 days due date.`)
   } catch (error) {console.error("Error generating notifications:", error)}
})

// Function to check for subscriptions every day at 8 AM that are 1 day away from billing
cron.schedule('0 8 * * *', async () => {
   console.log("Running subscription check, 1 day due date...")
   try {
   // Calculate the date exactly 1 day from right now
   const target_date = new Date()
   target_date.setDate(target_date.getDate() + 1)
   const year = target_date.getFullYear()
   const month = String(target_date.getMonth() + 1).padStart(2, '0')
   const day = String(target_date.getDate()).padStart(2, '0')
   const date_string = `${year}-${month}-${day}T00:00:00.000Z`
   // Find all active subscriptions billing on that exact day
   const upcoming_subscriptions_1day = await prisma.subscription.findMany({
      where: {
         is_active: true,
         next_billing_date: {equals: date_string}
      }
   })
   // Generate a Notification record for each one found
   for (const sub of upcoming_subscriptions_1day) {
      await prisma.notification.create({
         data: {
            user_id: sub.user_id,
            subscription_id: sub.id,
            type: 'ONE_DAY_BEFORE',
            message: `${sub.name} will charge ${sub.currency} ${sub.amount} in 1 day.`,
            notify_at: new Date(),
            is_read: false
         }
      })
   }
   console.log(`Generated ${upcoming_subscriptions_1day.length} notifications for 1 day due date.`)
   } catch (error) {console.error("Error generating notifications:", error)}
})

// Function to check for subscriptions every day at 8 AM that are due today
cron.schedule('0 8 * * *', async () => {
   console.log("Running subscription check, due today...")
   try {
   // Calculate today's date
   const target_date = new Date()
   target_date.setHours(0, 0, 0, 0)
   const year = target_date.getFullYear()
   const month = String(target_date.getMonth() + 1).padStart(2, '0')
   const day = String(target_date.getDate()).padStart(2, '0')
   const date_string = `${year}-${month}-${day}T00:00:00.000Z`
   // Find all active subscriptions billing today
   const due_subscriptions = await prisma.subscription.findMany({
      where: {
         is_active: true,
         next_billing_date: {equals: date_string}
      }
   })
   // Generate a Notification record for each one found
   for (const sub of due_subscriptions) {
      await prisma.notification.create({
         data: {
            user_id: sub.user_id,
            subscription_id: sub.id,
            type: 'DUE_TODAY',
            message: `${sub.name} is due today. It will charge ${sub.currency} ${sub.amount}.`,
            notify_at: new Date(),
            is_read: false
         }
      })
   }
   console.log(`Generated ${due_subscriptions.length} notifications for due today.`)
   } catch (error) {console.error("Error generating notifications:", error)}
})