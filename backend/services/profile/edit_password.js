const is_production = process.env.NODE_ENV === 'production'
const jwt = require('jsonwebtoken')
const { change_password_email } = require('../../utils/code_mailer')

async function profile_edit_password(req, res, prisma) {
   const { email } = req.body
	if(typeof email !== 'string') return res.status(400).json({ message: 'Invalid email.' })
	try {
		const user = await prisma.user.findUnique({ where: { id: req.user.id } })
      if(!user) res.status(401).json({ message: 'Invalid user.' })
      const email_db = user.email
      
      const code = Math.floor(100000 + Math.random() * 900000).toString() // 6 digits
		const token_edit_password = jwt.sign({ email_db, code }, process.env.JWT_SECRET, { expiresIn: '10m' })
		
		res.cookie('token_edit_password', token_edit_password, {
         httpOnly: true,
         maxAge: 10 * 60 * 1000, // 10 min
         sameSite: is_production ? 'none' : 'lax',
			secure: is_production
      })
		await change_password_email({email: email_db, code})
		res.status(200).json({ message: 'Code sent successfully.' })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Error editing password.' })
	}
}

module.exports = profile_edit_password