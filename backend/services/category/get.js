const { get_or_set_cache } = require('../../utils/redis')

async function category(req, res, prisma) {
   const cache_key = `categories:${req.user.id}`
	try {
		const categories = await get_or_set_cache(cache_key, 120, async ()=> {
			return await prisma.category.findMany({ where: { user_id: req.user.id } })
		})
		res.status(200).json({ categories })
	} catch (error) {res.status(500).json({ message: 'Error retrieving categories.' })}
}

module.exports = category