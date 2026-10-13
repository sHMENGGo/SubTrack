const { get_or_set_cache } = require('../../utils/redis')

async function budget(req, res, prisma) {
   const cache_key = `budgets:${req.user.id}`
	try {
		const budgets = await get_or_set_cache(cache_key, 120, async ()=> {
			return await prisma.budget.findMany({ where: { user_id: req.user.id } })
		})
		res.status(200).json({ budgets })
	} catch (error) {res.status(500).json({ message: 'Error retrieving budgets.' })}
}

module.exports = budget