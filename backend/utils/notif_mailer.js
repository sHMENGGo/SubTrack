const { send_email } = require('./notif_mailer')

// Look and wording per notification type (colors match the in-app alert colors)
const alert_styles = {
   ONE_WEEK_BEFORE: { label: 'Renews in 1 week', color: '#2563eb', bg: '#eff6ff' },
   THREE_DAYS_BEFORE: { label: 'Renews in 3 days', color: '#16a34a', bg: '#f0fdf4' },
   ONE_DAY_BEFORE: { label: 'Renews tomorrow', color: '#d97706', bg: '#fffbeb' },
   DUE_TODAY: { label: 'Due today', color: '#dc2626', bg: '#fef2f2' }
}

// Stop user-provided text (subscription name, user name) from breaking the HTML
function escape_html(value) {
   return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
}

function format_amount(amount, currency) {
   const value = Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
   })
   return `${currency} ${value}`
}

// Billing dates are stored as UTC midnight, so format in UTC to avoid showing the day before
function format_date(date) {
   return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
   })
}

// HTML layout of renewal reminder email
function build_notification_html({ user_name, sub, style }) {
   return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7; padding: 40px 0;">
         <tr>
            <td align="center">
               <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; font-family: Arial, Helvetica, sans-serif;">
                  <tr>
                     <td style="background-color: #2563eb; padding: 24px 32px;">
                        <span style="color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">SubTrack</span>
                     </td>
                  </tr>
                  <tr>
                     <td style="padding: 32px;">
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;">Hi ${escape_html(user_name)},</p>
                        <h1 style="margin: 0 0 24px 0; font-size: 20px; color: #111827;">${escape_html(sub.name)}: ${style.label}</h1>
                        <div style="background-color: ${style.bg}; border-left: 4px solid ${style.color}; border-radius: 6px; padding: 16px 20px;">
                           <p style="margin: 0 0 6px 0; font-size: 13px; color: #6b7280;">Amount</p>
                           <p style="margin: 0 0 14px 0; font-size: 22px; font-weight: 700; color: ${style.color};">${escape_html(format_amount(sub.amount, sub.currency))}</p>
                           <p style="margin: 0 0 6px 0; font-size: 13px; color: #6b7280;">Billing date</p>
                           <p style="margin: 0; font-size: 15px; font-weight: 600; color: #111827;">${escape_html(format_date(sub.next_billing_date))}</p>
                        </div>
                        <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 20px; color: #9ca3af;">SubTrack only tracks your subscriptions. It does not charge, renew or cancel anything for you.</p>
                     </td>
                  </tr>
                  <tr>
                     <td style="padding: 20px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; font-size: 12px; color: #9ca3af;">SubTrack &middot; Subscription tracking made simple</p>
                     </td>
                  </tr>
               </table>
            </td>
         </tr>
      </table>
   `
}

// Send one renewal reminder email. Throws if the type is unknown or the relay fails.
async function send_notification_email({ email, user_name, sub, type }) {
   const style = alert_styles[type]
   if (!style) throw new Error(`Unknown notification type: ${type}`)
   if (!email) throw new Error(`No email address for subscription ${sub.id}`)

   await send_email({
      to: email,
      subject: `${sub.name}: ${style.label}`,
      html: build_notification_html({ user_name, sub, style })
   })
}

module.exports = { send_notification_email }