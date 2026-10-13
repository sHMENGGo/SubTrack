const jwt = require('jsonwebtoken')
const { delete_cache } = require('../../utils/redis')

async function profile_edit_email_verify(req, res, prisma) {
   const { new_email, code } = req.body
	if(typeof new_email !== 'string') return res.status(400).json({ message: 'Invalid email.' })
	if(typeof code !== 'string') return res.status(400).json({ message: 'Invalid code.' })
	
   const verification_token_email = req.cookies.verification_token_email
	if(!verification_token_email) return res.status(400).json({ message: 'No token sent.' })
	
   try {
		const decoded = jwt.verify(verification_token_email, process.env.JWT_SECRET)
		if(decoded.code !== code || decoded.new_email !== new_email) return res.status(400).json({ message: 'Invalid code.' })
		
         await prisma.user.update({
			where: { id: req.user.id },
			data: { email: new_email }
		})

      await delete_cache(`profile:${req,user.id}`)

		res.status(200).json({ message: 'Email edited successfully.' })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Error editing email.' })
	}
}

module.exports = profile_edit_email_verify