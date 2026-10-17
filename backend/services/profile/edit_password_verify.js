const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { delete_cache } = require('../../utils/redis')
const is_production = process.env.NODE_ENV === 'production'

async function profile_edit_password_verify(req, res, prisma) {
   const { email, code, current_password, new_password } = req.body
   const token_edit_password = req.cookies.token_edit_password

   if(!token_edit_password) return res.status(400).json({ message: 'No code sent.' })
   if(typeof code !== 'string' || code.trim().length === 0) return res.status(400).json({ message: 'Invalid code.' })  
   if(typeof current_password !== 'string' || current_password.trim().length === 0) return res.status(400).json({ message: 'Invalid current password.' })  
   if(typeof new_password !== 'string' || new_password.trim().length === 0) return res.status(400).json({ message: 'Invalid new password.' })  
   if(typeof email !== 'string' || email.trim().length === 0) return res.status(400).json({ message: 'Invalid email.' })  

   try {
      const user = await prisma.user.findUnique({ where: {id: req.user.id } })
      if(user.email !== email) return res.status(401).json({ message: 'Invalid email.' })
      
      const password_matched = bcrypt.compare(current_password, user.password)
      if(!password_matched) return res.status(401).json({ message: 'Invalid current password.' })

      const password_hash = await bcrypt.hash(new_password, 11)
      const decoded = jwt.verify(token_edit_password, process.env.JWT_SECRET)
      if(decoded.code === code){
         await prisma.user.update({
            where: { email: email },
            data: { password: password_hash, }
         })
         await delete_cache(`profile:${req.user.id}`)

         res.clearCookie('token_edit_password', {
            httpOnly: true,
            sameSite: is_production ? 'none' : 'lax',
            secure: is_production
         })

      } else { res.status(400).json({ message: 'Invalid code.' }) }

      

      res.status(201).json({ message: 'Password changed successfully.' })
   } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'Error changing password.' })
   }
}

module.exports = profile_edit_password_verify