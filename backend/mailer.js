const nodemailer = require('nodemailer')
require('dotenv').config()

const transporter = nodemailer.createTransport({
   service: 'gmail',
   auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
   }
})

async function send_verification_email(reg_email, code) {
   await transporter.sendMail({
      from: `SubTrack <${process.env.GMAIL_USER}>`,
      to: reg_email,
      subject: 'Your SubTrack verification code',
      html: `<p>Your verification code is:</p><h2>${code}</h2><p>This code expires in 10 minutes.</p>`
   })
}

module.exports = { transporter, send_verification_email }