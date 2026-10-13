const { get_or_set_cache } = require('../../utils/redis')

async function dashboard_category_spent(req, res, prisma) {
   const { toggle } = req.body

   if (!toggle) return res.status(400).json({ message: 'Currency is required.' })
	if(typeof toggle !== 'string' || toggle.trim().length === 0) return res.status(400).json({ message: 'Invalid currency.' })  

	const today = new Date();
   const month_index = today.getMonth() + 1
   const today_year = today.getFullYear()

   const month_start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
   const month_end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0))
	
	const cache_key = `category_spent:${req.user.id}:${toggle}`
   try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			// Get subscriptions total amount by category (active only)
			const grouped_spent = await prisma.subscription.groupBy({
				by: ['category_id'],
				where: {
					currency: toggle,
					user_id: req.user.id,
					category_id: { not: null },
					is_active: true,
					next_billing_date: { gte: month_start, lte: month_end }
				},
				_sum: { amount: true }
			})
			// Get categories of spent
			const category_ids = grouped_spent.map(spent => spent.category_id)
			const categories = await prisma.category.findMany({
				where: { id: { in: category_ids }, user_id: req.user.id },
				select: { id: true, name: true, color_hex: true }
			})
			// Get budget of this month
			const budgets = await prisma.budget.findMany({
				where: {
					currency: toggle,
					month: month_index,
					year: today_year,
					user_id: req.user.id,
					category_id: { in: category_ids }
				}
			})
			// Combine
			const spent_category = grouped_spent.map(group => {
				const category_data = categories.find(c => c.id === group.category_id) || { name: 'Unknown', color_hex: '#ccc' }
				const budget_match = budgets.find(b => b.category_id === group.category_id)
				return {
					category_id: group.category_id,
					total_amount: Number(group._sum.amount || 0).toFixed(2),
					category_name: category_data.name,
					category_hex: category_data.color_hex,
					category_budget: Number(budget_match?.amount || 0).toFixed(2)
				}
			})
		
			return { spent_category }
		})
      res.status(200).json({ spent_category: result.spent_category, message: 'Spent by category retrieved successfully.' })
   } catch (error) {
      console.log('error: ', error)
      res.status(500).json({ message: 'Error fetching category spent.' })
   }
}

module.exports = dashboard_category_spent