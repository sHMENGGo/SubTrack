const { get_or_set_cache } = require('../../utils/redis')

async function dashboard_total_active_sub(req, res, prisma) {
   const cache_key = `total_active_subs:${req.user.id}`
	try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			const data = await prisma.subscription.findMany({ where: { is_active: true, user_id: req.user.id } })
			return { data }
		})

		res.status(200).json({ active_subs: result.data.length, message: 'Active subscriptions retrieved successfully.'})
	} catch (error) {
		console.log('error: ', error)
		res.status(500).json({ message: 'Error retrieving active subscriptions.' })
	}
}

module.exports = dashboard_total_active_sub