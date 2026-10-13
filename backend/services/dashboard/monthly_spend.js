const { get_or_set_cache } = require('../../utils/redis')

async function dashboard_monthly_spend(req, res, prisma) {
   const cache_key = `monthly_spends:${req.user.id}`
	try {
		const result = await get_or_set_cache(cache_key, 120, async ()=> {
			const data = await prisma.subscription.groupBy({
				where: {user_id: req.user.id},
				by: ['currency'],
				_sum: { amount: true } 
			})
			const monthly_php = data.find(item => item.currency === 'PHP')
			const monthly_usd = data.find(item => item.currency === 'USD')
		
			return { monthly_php, monthly_usd }
		})
		
		res.status(200).json({ 
			monthly_php: Number(result.monthly_php?._sum?.amount / 12 || 0).toFixed(2), 
			monthly_usd: Number(result.monthly_usd?._sum?.amount / 12 || 0).toFixed(2), 
			message: 'monthly_spend retrieved successfully.'
		})
	} catch (error) {
		console.log('error: ', error)
		res.status(500).json({ message: 'Error retrieving monthly spend.' })
	}
}

module.exports = dashboard_monthly_spend