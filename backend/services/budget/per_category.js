const { get_or_set_cache } = require('../../utils/redis')

async function budget_per_category(req, res, prisma) {
   const { toggle, input_month_index, input_year } = req.body

	if(typeof toggle !== 'string' || toggle.trim().length === 0) return res.status(400).json({ message: 'Invalid currency.' })  
	if(typeof input_month_index !== 'number' || input_month_index.length === 0) return res.status(400).json({ message: 'Invalid month.' })  
	if(typeof input_year !== 'number' || input_year.length === 0) return res.status(400).json({ message: 'Invalid year.' })  

	const date = new Date()
	// Create strings for the ISO date (e.g., "08")
   const current_month_str = String(input_month_index + 1).padStart(2, '0');
   const start_of_month = `${input_year}-${current_month_str}-01T00:00:00.000Z`;
   // Last of month: new Date(year, month, 0) gets the last day of the PREVIOUS month.
   const last_day_date = new Date(input_year, input_month_index + 1, 0);
   const last_day = String(last_day_date.getDate()).padStart(2, '0');
   const end_of_month = `${input_year}-${current_month_str}-${last_day}T23:59:59.999Z`;

	const cache_key = `category_budget:${req.user.id}:${toggle}:${start_of_month}:${end_of_month}`
	try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			const categories = await prisma.category.findMany({ where: { user_id: req.user.id } })
			const budgets = await prisma.budget.groupBy({
				by: ['id','category_id'],
				where: { user_id: req.user.id, currency: toggle, month: input_month_index + 1, year: input_year },
				_sum: { amount: true }
			})
			const subscriptions = await prisma.subscription.groupBy({
				by: ['category_id'],
				where: { currency: toggle, user_id: req.user.id, next_billing_date: { gte: start_of_month, lte: end_of_month } },
				_sum: { amount: true }
			})
			// Combine
			const categories_budgets = categories.map(cat => {
				const subscription_match = subscriptions.find(sub => sub.category_id === cat.id)
				const budget_match = budgets.find(bud => bud.category_id === cat.id)
				const budget_amount = Number(budget_match?._sum?.amount || 0).toFixed(2)
				const subscription_amount = Number(subscription_match?._sum?.amount || 0).toFixed(2)
				return {
					id: cat.id,
					budget_id: budget_match?.id || null,
					name: cat.name,
					color_hex: cat.color_hex,
					budget: Number(budget_match?._sum?.amount || 0).toFixed(2),
					amount: Number(subscription_match?._sum?.amount || 0).toFixed(2),
					color_hex: cat.color_hex,
					left: Number(budget_amount - subscription_amount < 0 ? 0 : budget_amount - subscription_amount).toFixed(2)
				}
			})
		
			return { categories_budgets }
		})

		res.status(200).json({ categories_budgets: result.categories_budgets, message: 'Categories budgets retrieved successfully' })
	} catch (error) {
      console.log('error: ', error)
      res.status(500).json({ message: 'Error fetching categories with budget.' })
   }
}

module.exports = budget_per_category