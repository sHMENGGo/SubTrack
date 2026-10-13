const { get_or_set_cache } = require('../../utils/redis')

async function dashboard_total_budget(req, res, prisma) {
   const cache_key = `total_budget:${req.user.id}`
	try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			const data = await prisma.budget.groupBy({
				where: {user_id: req.user.id},
				by: ['currency'],
				_sum: { amount: true }
			})
			const php = data.find(item => item.currency === 'PHP')
			const usd = data.find(item => item.currency === 'USD')
		
			return { php, usd }
		})
		
		res.status(200).json({
			total_php: Number(result.php?._sum?.amount || 0).toFixed(2),
			total_usd: Number(result.usd?._sum?.amount || 0).toFixed(2),
			message: 'Total budget retrieved successfully.'
		})
	} catch (error) {
		console.log('error: ', error)
      res.status(500).json({ message: 'Error getting total budget.' })
	}
}

module.exports = dashboard_total_budget