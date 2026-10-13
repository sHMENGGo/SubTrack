const { get_or_set_cache } = require('../../utils/redis')

async function budget_summary(req, res, prisma) {
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

	const cache_key = `budget_summary:${req.user.id}:${toggle}:${start_of_month}:${end_of_month}`
	try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			const budget = await prisma.budget.aggregate({
				where: { month: input_month_index + 1, year: input_year, currency: toggle, user_id: req.user.id },
				_sum: { amount: true }
			})
			const subs_total = await prisma.subscription.aggregate({
				where: { currency: toggle, user_id: req.user.id, next_billing_date: { gte: start_of_month, lte: end_of_month } },
				_sum: { amount: true }
			})
			const budget_summary = {}
			budget_summary.budget = Number(budget._sum.amount || 0).toFixed(2)
			budget_summary.subs_total = Number(subs_total._sum.amount || 0).toFixed(2)
		
			return { budget_summary }
		})

		res.status(200).json({ budget_summary: result.budget_summary, message: 'Budget summary retrieved successfully'})
	} catch (error) {
      console.log('error: ', error)
      res.status(500).json({ message: 'Error fetching budget summary.' })
   }
}

module.exports = budget_summary