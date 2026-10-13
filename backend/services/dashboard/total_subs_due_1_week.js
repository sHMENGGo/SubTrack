const { get_or_set_cache } = require('../../utils/redis')

async function dashboard_total_subs_due_1_week(req, res, prisma) {
   // Date today (Start of day)
	const today_start_string = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z'
	const today_start = new Date(today_start_string)
   
	// Date next week (End of day)
   const next_week_end_string = new Date().toISOString().split('T')[0] + 'T23:59:59.999Z'
	const next_week_end = new Date(next_week_end_string)
   next_week_end.setDate(next_week_end.getDate() + 7)

	const cache_key = `total_due_1_week:${req.user.id}:${today_start}:${next_week_end}`
	try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			const data = await prisma.subscription.findMany({
				where: { next_billing_date: { gte: today_start, lte: next_week_end}, user_id: req.user.id}
			})
			return { data }
		})
		
		res.status(200).json({ due_1_week: result.data.length, message: '1 week due subscriptions retrieved successfully.' })
	} catch (error) {
		console.log('error: ', error)
		res.status(500).json({ message: 'Error retrieving 1 week due subscriptions.' })
	}
}

module.exports = dashboard_total_subs_due_1_week