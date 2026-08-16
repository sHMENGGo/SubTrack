const { PrismaClient } = require('./prisma/generated/client')
const { PrismaPg } = require('@prisma/adapter-pg')
require('dotenv').config()
const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL})
const prisma = new PrismaClient({ adapter })

function get_date_string(date) {
   const year = date.getFullYear()
   const month = String(date.getMonth() + 1).padStart(2, '0')
   const day = String(date.getDate()).padStart(2, '0')
   return `${year}-${month}-${day}T00:00:00.000Z`
}

// Advance next_billing_date for subscriptions that are due, logging PaymentHistory
async function update_billing_dates() {
   console.log("Checking next billing date of subscriptions for update...")
   const today = new Date()
   try {
      const subs = await prisma.subscription.findMany({ where: { next_billing_date: { lte: today }, is_active: true } })
      let sub_count = 0
      let sub_history = 0
      for (let sub of subs) {
         const old_date = new Date(sub.next_billing_date)
         const next_date = new Date(old_date)
         while (next_date <= today) {
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
   } catch (error) {
      console.error("Error updating next billing date of subscriptions: ", error)
   }
}

// Generate a renewal notification for subscriptions billing on a given offset (in days from today)
async function generate_notifications_for_offset(days_offset, type, message, log_label) {
   console.log(`Running subscription check, ${log_label}...`)
   try {
      const target_date = new Date()
      target_date.setDate(target_date.getDate() + days_offset)
      target_date.setHours(0, 0, 0, 0)
      const date_string = get_date_string(target_date)

      const upcoming_subs = await prisma.subscription.findMany({
         where: {
            is_active: true,
            next_billing_date: { equals: date_string }
         }
      })

      for (const sub of upcoming_subs) {
         await prisma.notification.create({
            data: {
               user_id: sub.user_id,
               subscription_id: sub.id,
               type,
               message,
               notify_at: new Date(),
               is_read: false
            }
         })
      }
      console.log(`Generated ${upcoming_subs.length} notifications for ${log_label}.`)
   } catch (error) {
      console.error(`Error generating notifications for ${log_label}:`, error)
   }
}

// Full daily job: advance billing dates, then generate all renewal notifications
async function run_daily_job() {
   await update_billing_dates()
   await generate_notifications_for_offset(7, 'ONE_WEEK_BEFORE', 'Renews in 1 week', '1 week due date')
   await generate_notifications_for_offset(3, 'THREE_DAYS_BEFORE', 'Renews in 3 days', '3 days due date')
   await generate_notifications_for_offset(1, 'ONE_DAY_BEFORE', 'Renews tomorrow', '1 day due date')
   await generate_notifications_for_offset(0, 'DUE_TODAY', 'Due today', 'due today')
}

module.exports = { run_daily_job }