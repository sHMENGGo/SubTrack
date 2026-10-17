const is_production = process.env.NODE_ENV === 'production'
const jwt = require('jsonwebtoken')
const { change_email } = require('../../utils/code_mailer')

async function profile_edit_email(req, res, prisma) {
   const { new_email } = req.body
	if(typeof new_email !== 'string') return res.status(400).json({ message: 'Invalid email.' })
	try {
		const email = await prisma.user.findUnique({ where: { email: new_email } })
		if(email) return res.status(400).json({ message: 'Email already used.' })
		const code = Math.floor(100000 + Math.random() * 900000).toString() // 6 digits
		const verification_token_email = jwt.sign({ new_email, code }, process.env.JWT_SECRET, { expiresIn: '10m' })
		res.cookie('verification_token_email', verification_token_email, {
			httpOnly: true,
			maxAge: 10 * 60 * 1000, // 10 min
			sameSite: is_production ? 'none' : 'lax',
			secure: is_production
		})
		await change_email(new_email, code)
		res.status(200).json({ message: 'Email edited successfully.' })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Error editing email.' })
	}
}

module.exports = profile_edit_email