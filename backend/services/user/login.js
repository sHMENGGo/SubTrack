const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const is_production = process.env.NODE_ENV === 'production'

async function login(req, res, prisma) {
   const { email, password, remember_me } = req.body
   
   if(typeof email !== 'string' || email.trim().length === 0) return res.status(400).json({ message: 'Invalid email or password.' })  
   if(typeof password !== 'string' || password.trim().length === 0) return res.status(400).json({ message: 'Invalid email or password.' })  
   if(typeof remember_me !== 'boolean') return res.status(400).json({ message: 'Invalid check box.' })  
   
   try {
      const user = await prisma.user.findUnique({ where: { email: email } })
      const password_match = user && await bcrypt.compare(password, user.password)
      if (!user || !password_match) {return res.status(400).json({ message: 'Invalid email or password.' })}
      const token = jwt.sign({ id: user.id, name: user.name }, process.env.JWT_SECRET, { expiresIn: (remember_me ? '30d' : '1hr') })
      
      res.cookie('token', token, { 
         httpOnly: true, 
         secure: is_production,
         sameSite: is_production ? 'none' : 'strict',
         ...(remember_me ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : { maxAge: 60 * 60 * 1000 }) // 30 days or 1 hours
      })
      
      res.status(200).json({ message: 'Login successful!' })
   } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'Error occurred while logging in.' })
   }
}

module.exports = { login }