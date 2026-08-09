const { PrismaClient } = require('./prisma/generated/client')
const { PrismaPg } = require('@prisma/adapter-pg')
require('dotenv').config()
const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL})
const prisma = new PrismaClient({ adapter })

const cron = require('node-cron')

// Function to update next billing date after due date
cron.schedule('* 1 * * *', async () => {
   console.log("Checking next billing date of subscriptions for update...")
   const today = new Date()
   try {
      const subs = await prisma.subscription.findMany({ where: { next_billing_date: { lte: today }, is_active: true } })
      let sub_count = 0
      let sub_history = 0
      for (let sub of subs) {
         const old_date = new Date(sub.next_billing_date)
         const next_date = new Date(old_date)
         while(next_date <= today) {
            switch (sub.duration) {
               case 'weekly': next_date.setDate(next_date.getDate() + 7); break
               case 'monthly': next_date.setMonth(next_date.getMonth() + 1); break
               case 'yearly': next_date.setFullYear(next_date.getFullYear() + 1); break
            }
         }

         await prisma.$transaction([
            prisma.paymentHistory.create({ data: {
               subscription: { connect: { id: sub.id } },
               amount: sub.amount,
               currency: sub.currency,
               billing_date: old_date,
               user: { connect: { id: sub.user_id } }
            }}),
            prisma.subscription.update({
               where: { id: sub.id },
               data: { next_billing_date: next_date }
            })
         ])
         sub_history++
         sub_count++
      }
      console.log(`Stored ${sub_history} subscriptions in history.`)
      console.log(`Updated ${sub_count} subscriptions next billing date.`)
   } catch (error) {console.error("Error updating next billing date of subscriptions: ", error)}
})

// Function to check for subscriptions every day at 8 AM that are 1 week away from billing
cron.schedule('0 0 * * *', async () => {
   console.log("Running subscription check, 1 week due date...")
   try {
   // Calculate the date exactly 3 days from right now
   const target_date = new Date()
   target_date.setDate(target_date.getDate() + 7)
   console.log("Target date for 7 days due date:", target_date)
   const year = target_date.getFullYear()
   const month = String(target_date.getMonth() + 1).padStart(2, '0') // Months are zero-indexed
   const day = String(target_date.getDate()).padStart(2, '0')
   const date_string = `${year}-${month}-${day}T00:00:00.000Z`
   // Find all active subscriptions billing on that exact day
   const upcoming_subscriptions_1week = await prisma.subscription.findMany({
      where: {
         is_active: true,
         next_billing_date: {equals: date_string}
      }
   })
   // Generate a Notification record for each one found
   for (const sub of upcoming_subscriptions_1week) {
      await prisma.notification.create({
         data: {
            user_id: sub.user_id,
            subscription_id: sub.id,
            type: 'ONE_WEEK_BEFORE',
            message: `${sub.name} will charge ${sub.currency} ${sub.amount} in 1 week.`,
            notify_at: new Date(),
            is_read: false
         }
      })
   }
   console.log(`Generated ${upcoming_subscriptions_3days.length} notifications for 1 week due date.`)
   } catch (error) {console.error("Error generating notifications 1 week before:", error)}
})

// Function to check for subscriptions every day at 8 AM that are 3 days away from billing
cron.schedule('0 1 * * *', async () => {
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
   } catch (error) {console.error("Error generating notifications 3 days before:", error)}
})

// Function to check for subscriptions every day at 8 AM that are 1 day away from billing
cron.schedule('0 1 * * *', async () => {
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
   } catch (error) {console.error("Error generating notifications 1 day before:", error)}
})

// Function to check for subscriptions every day at 8 AM that are due today
cron.schedule('0 1 * * *', async () => {
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
   } catch (error) {console.error("Error generating notifications due today:", error)}
})

