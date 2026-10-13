const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const is_production = process.env.NODE_ENV === 'production'
const { register_account_email } = require('../../utils/mailer')

async function register(req, res, prisma) {
   const { email } = req.body

	if(!email) return res.status(400).json({ message: 'Email is required.' })
	if(typeof email !== 'string' || email.trim().length === 0) return res.status(400).json({ message: 'Invalid email.' })  

	try {
		const user = await prisma.user.findUnique({ where: { email } })
		if(user) return res.status(400).json({ message: 'Email already used.' })

      const code = Math.floor(100000 + Math.random() * 900000).toString() // 6 digits
		const verification_token = jwt.sign({ email, code }, process.env.JWT_SECRET, { expiresIn: '10m' })
		
		res.cookie('verification_token', verification_token, {
         httpOnly: true,
         maxAge: 10 * 60 * 1000, // 10 min
         sameSite: is_production ? 'none' : 'lax',
			secure: is_production
      })
		await register_account_email(email, code)

      res.json({ message: 'Verification code sent.' })
   } catch (err) {
      console.error(err)
      res.status(500).json({ message: 'Failed to send verification code.' })
   }
}

async function register_verify(req, res, prisma) {
   const { code, name, password, email } = req.body
   const verification_token = req.cookies.verification_token

   if(!verification_token) return res.status(400).json({ message: 'No code sent.' })
   if(typeof code !== 'string' || code.trim().length === 0) return res.status(400).json({ message: 'Invalid code.' })  
   if(typeof name !== 'string' || name.trim().length === 0) return res.status(400).json({ message: 'Invalid name.' })  
   if(typeof password !== 'string' || password.trim().length === 0) return res.status(400).json({ message: 'Invalid password.' })  
   if(typeof email !== 'string' || email.trim().length === 0) return res.status(400).json({ message: 'Invalid email.' })  

   try {
      const password_hash = await bcrypt.hash(password, 11)
      const decoded = jwt.verify(verification_token, process.env.JWT_SECRET)
      if(decoded.code === code){
         await prisma.user.create({data: {
         name: name, 
         password: password_hash, 
         email: email}})
      } else { res.status(400).json({ message: 'Invalid code.' }) }
      res.status(201).json({ message: 'Account registered successfully.' })
   } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'Error registering user.' })
   }
}

module.exports = { register, register_verify }