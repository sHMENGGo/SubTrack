const { get_or_set_cache } = require('../../utils/redis')

async function profile(req, res, prisma) {
   const cache_key = `profile:${req.user.id}`
   try {
		const user = await get_or_set_cache(cache_key, 120, async ()=> {
			return await prisma.user.findUnique({ where: { id: req.user.id } })
		})
		res.status(200).json({ name: user.name, email: user.email, password: user.password, message: 'Profile retrieved successfully.' })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Error retrieving profile.' })
	}
}

module.exports = profile