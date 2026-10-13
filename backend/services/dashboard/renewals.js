const { get_or_set_cache } = require('../../utils/redis')

async function dashboard_renewals(req, res, prisma) {

	const today_start = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00.000Z')
   const next_3_days_end = new Date(Date.UTC(today_start.getUTCFullYear(), today_start.getUTCMonth(), today_start.getUTCDate() + 3, 23, 59, 59, 999))

	const month_name = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	
	const cache_key = `renewals:${req.user.id}:${today_start}:${next_3_days_end}`
	try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			const renewals = await prisma.subscription.findMany({
				where: { 
					next_billing_date: { gte: today_start, lte: next_3_days_end }, 
					user_id: req.user.id 
				},
				include: {category: {select: {color_hex: true } } }
			})
			const formatted_renewals = renewals.map(renewal => ({
				...renewal, 
				amount: Number(renewal.amount).toFixed(2),
				month: month_name[renewal.next_billing_date.getMonth()],
				day: String(renewal.next_billing_date.getDate()).padStart(2, 0)
			}))
		
			return { formatted_renewals }
		})

		res.status(200).json({formatted_renewals: result.formatted_renewals, message: 'Upcoming renewals retrieved successfully.'})
	} catch (error) {
      console.log('error: ', error)
      res.status(500).json({ message: 'Error fetching upcoming renewals.' })
   }
}

module.exports = dashboard_renewals