const nodemailer = require('nodemailer')
require('dotenv').config()

const transporter = nodemailer.createTransport({
   service: 'gmail',
   auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
   }
})

async function send_register_verification_email(reg_email, code) {
   await transporter.sendMail({
      from: `SubTrack <${process.env.GMAIL_USER}>`,
      to: reg_email,
      subject: 'Verify your SubTrack account',
      html: `
         <p>Welcome to SubTrack! Use the 6 digit code below to verify your email address:</p>
         <h2>${code}</h2>
         <p>This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      `
   })
}

async function send_forgot_verification_email(email_db, code) {
   await transporter.sendMail({
      from: `SubTrack <${process.env.GMAIL_USER}>`,
      to: email_db,
      subject: 'Reset your password',
      html: `
         <p>Get back your account. Use the 6 digit code below to verify your email address:</p>
         <h2>${code}</h2>
         <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      `
   })
}

module.exports = { send_forgot_verification_email, send_register_verification_email }