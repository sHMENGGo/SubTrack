const { delete_cache } = require('../../utils/redis')

async function profile_edit_name(req, res, prisma) {
   const { name } = req.body
   if(typeof name !== 'string') return res.status(400).json({ message: 'Invalid name.' })
   try {
      await prisma.user.update({
         where: { id: req.user.id },
         data: { name: name }
      })

      await delete_cache(`profile:${req.user.id}`)

      res.status(200).json({ message: 'Name edited successfully.' })
   } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'Error editing name.' })
   }
}

module.exports = profile_edit_name