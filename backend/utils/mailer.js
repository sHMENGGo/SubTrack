require('dotenv').config()

async function send_email({ to, subject, html }) {
   const response = await fetch(process.env.GMAIL_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
         secret: process.env.GMAIL_SCRIPT_SECRET,
         to,
         subject,
         html
      })
   })
   const result = await response.json().catch(() => ({}))
   if (!response.ok || !result.ok) {
      throw new Error(`Email relay error: ${result.message || response.status}`)
   }
}

// HTML layout of email
function buildEmailHTML({ heading, message, code, footer }) {
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
                        <h1 style="margin: 0 0 12px 0; font-size: 20px; color: #111827;">${heading}</h1>
                        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #4b5563;">${message}</p>
                        <div style="text-align: center; margin: 32px 0;">
                           <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2563eb; background-color: #eff6ff; padding: 16px 24px; border-radius: 6px;">${code}</span>
                        </div>
                        <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 20px; color: #9ca3af;">${footer}</p>
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

async function send_verification_email(email, subject, heading, message, code) {
   await send_email({
      to: email,
      subject: subject,
      html: buildEmailHTML({
         heading: heading,
         message: message,
         code,
         footer: "This code expires in 10 minutes. If you didn't request this, you can safely ignore this email."
      })
   })
}

// Register account email
async function register_account_email(email, code) {
   send_verification_email({
      email,
      subject: 'Verify your SubTrack account',
      heading: 'Welcome to SubTrack!',
      message: 'Use the 6-digit code below to verify your email address and finish setting up your account.',
      code
   })
}

// Recover account email
async function recover_account_email(email, code) {
   send_verification_email({
      email,
      subject: 'Reset your password',
      heading: 'Recover your account',
      message: "Use the 6-digit code below to verify it's you and reset your SubTrack password.",
      code
   })
}

// Change password email
async function change_password_email(email, code) {
   send_verification_email({
      email,
      subject: 'Change your password',
      heading: 'You are editing your account',
      message: "Use the 6-digit code below to verify it's you and change your SubTrack password.",
      code
   })
}

// Change email
async function change_email(email, code) {
   send_verification_email({
      email,
      subject: 'Change your password',
      heading: 'You are editing your account',
      message: "Use the 6-digit code below to verify it's you and change your SubTrack password.",
      code
   })
}

module.exports = { register_account_email, recover_account_email, change_password_email, change_email }