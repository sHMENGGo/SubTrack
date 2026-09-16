const nodemailer = require('nodemailer')
const dns = require('node:dns').promises
require('dotenv').config()

let cachedIPv4Transporter = null
let cachedAt = 0

async function getTransporter() {
   if (cachedIPv4Transporter && Date.now() - cachedAt < 10 * 60 * 1000) {
      return cachedIPv4Transporter
   }

   const { address: ipv4 } = await dns.lookup('smtp.gmail.com', { family: 4 })

   cachedIPv4Transporter = nodemailer.createTransport({
      host: ipv4,
      port: 465,
      secure: true,
      tls: {
         servername: 'smtp.gmail.com'
      },
      auth: {
         user: process.env.GMAIL_USER,
         pass: process.env.GMAIL_APP_PASSWORD
      }
   })
   cachedAt = Date.now()
   return cachedIPv4Transporter
}

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

async function send_register_verification_email(reg_email, code) {
   const transporter = await getTransporter()
   await transporter.sendMail({
      from: `SubTrack <${process.env.GMAIL_USER}>`,
      to: reg_email,
      subject: 'Verify your SubTrack account',
      html: buildEmailHTML({
         heading: 'Welcome to SubTrack!',
         message: 'Use the 6-digit code below to verify your email address and finish setting up your account.',
         code,
         footer: `This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.`
      })
   })
}

async function send_forgot_verification_email(email_db, code) {
   const transporter = await getTransporter()
   await transporter.sendMail({
      from: `SubTrack <${process.env.GMAIL_USER}>`,
      to: email_db,
      subject: 'Reset your password',
      html: buildEmailHTML({
         heading: 'Reset your password',
         message: 'Use the 6-digit code below to verify it\'s you and reset your SubTrack password.',
         code,
         footer: `This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.`
      })
   })
}

module.exports = { send_forgot_verification_email, send_register_verification_email }