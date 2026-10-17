const { PrismaClient } = require('../prisma/generated/client')
const { PrismaPg } = require('@prisma/adapter-pg')
require('dotenv').config()
const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL})
const prisma = new PrismaClient({ adapter })
const { send_notification_email } = require('./notif_mailer')

// Turn a Date into "YYYY-MM-DDT00:00:00.000Z" using the server's local calendar day
function get_date_string(date) {
   const year = date.getFullYear()
   const month = String(date.getMonth() + 1).padStart(2, '0')
   const day = String(date.getDate()).padStart(2, '0')
   return `${year}-${month}-${day}T00:00:00.000Z`
}

// Midnight (UTC-labelled) of the current calendar day, same style as stored billing dates
function get_today_start() {
   return new Date(get_date_string(new Date()))
}

// Add N days using UTC math
function add_days(date, days) {
   const result = new Date(date)
   result.setUTCDate(result.getUTCDate() + days)
   return result
}

// Add N months without overflowing into the next month (Jan 31 + 1 month = Feb 28/29)
function add_months(date, months) {
   const day = date.getUTCDate()
   const result = new Date(date)
   result.setUTCDate(1)
   result.setUTCMonth(result.getUTCMonth() + months)
   const last_day = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate()
   result.setUTCDate(Math.min(day, last_day))
   return result
}

// Move a date forward by one billing period; throws on an unknown duration
function add_period(date, duration) {
   switch (String(duration).toLowerCase()) {
      case 'weekly': return add_days(date, 7)
      case 'monthly': return add_months(date, 1)
      case 'yearly': return add_months(date, 12)
      default: throw new Error(`Unknown duration: ${duration}`)
   }
}

// Advance next_billing_date for subscriptions that are due, logging PaymentHistory
async function update_billing_dates() {
   console.log("Checking next billing date of subscriptions for update...")
   const today = get_today_start()

   let subs = []
   try {
      subs = await prisma.subscription.findMany({
         where: { next_billing_date: { lte: today }, is_active: true }
      })
   } catch (error) {
      console.error("Error fetching subscriptions to update: ", error)
      return
   }

   let sub_count = 0
   for (const sub of subs) {
      try {
         const old_date = new Date(sub.next_billing_date)
         let next_date = add_period(old_date, sub.duration)
         while (next_date <= today) {
            next_date = add_period(next_date, sub.duration)
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
         sub_count++
      } catch (error) {
         console.error(`Failed to update subscription ${sub.id}: `, error)
      }
   }
   console.log(`Updated ${sub_count} of ${subs.length} subscriptions (history stored for each).`)
}

// Generate a renewal notification for subscriptions billing on a given offset (in days from today)
async function generate_notifications_for_offset(days_offset, type, message, log_label) {
   console.log(`Running subscription check, ${log_label}...`)

   const today_start = get_today_start()
   const day_start = add_days(today_start, days_offset)
   const day_end = add_days(day_start, 1)

   let upcoming_subs = []
   try {
      upcoming_subs = await prisma.subscription.findMany({
         where: {
            is_active: true,
            next_billing_date: { gte: day_start, lt: day_end }
         },
         include: { user: { select: { email: true, name: true } } }
      })
   } catch (error) {
      console.error(`Error fetching subscriptions for ${log_label}:`, error)
      return
   }

   let created = 0
   for (const sub of upcoming_subs) {
      try {
         const existing = await prisma.notification.findFirst({
            where: {
               subscription_id: sub.id,
               type,
               notify_at: { gte: today_start }
            }
         })
         if (existing) continue

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
         created++

         try {
            await send_notification_email({
               email: sub.user.email,
               user_name: sub.user.name,
               sub,
               type
            })
         } catch (email_error) {
            console.error(`Notification saved but email failed for subscription ${sub.id}:`, email_error)
         }
      } catch (error) {
         console.error(`Failed to notify for subscription ${sub.id}:`, error)
      }
   }
   console.log(`Generated ${created} notifications for ${log_label}.`)
}

// Full daily job: generate all renewal notifications, then advance billing dates
async function run_daily_job() {
   await generate_notifications_for_offset(7, 'ONE_WEEK_BEFORE', 'Renews in 1 week', '1 week due date')
   await generate_notifications_for_offset(3, 'THREE_DAYS_BEFORE', 'Renews in 3 days', '3 days due date')
   await generate_notifications_for_offset(1, 'ONE_DAY_BEFORE', 'Renews tomorrow', '1 day due date')
   await generate_notifications_for_offset(0, 'DUE_TODAY', 'Due today', 'due today')
   await update_billing_dates()
}

module.exports = { run_daily_job }