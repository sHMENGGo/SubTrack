const { get_or_set_cache } = require('../../utils/redis')

async function dashboard_month_budget_left(req, res, prisma) {
   const today = new Date();
   const month_index = today.getMonth() + 1
   const today_year = today.getFullYear()

   const month_start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
   const month_end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0))
	
   const cache_key = `total_budget_left:${req.user.id}:${month_start}:${month_end}`
	try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			// Get total amount of subscriptions this month (Spent)
			const data = await prisma.subscription.groupBy({
				where: { 
					next_billing_date: { gte: month_start, lte: month_end }, 
					user_id: req.user.id 
				},
				by: ['currency'],
				_sum: { amount: true }
			});

			const php_sub = data.find(item => item.currency === 'PHP');
			const usd_sub = data.find(item => item.currency === 'USD');

			const php_spent = Number((php_sub?._sum?.amount || 0).toFixed(2));
			const usd_spent = Number((usd_sub?._sum?.amount || 0).toFixed(2));

			// Get total budget of this month
			const budgets = await prisma.budget.groupBy({
				where: { month: month_index, year: today_year, user_id: req.user.id},
				by: ['currency'],
				_sum: { amount: true }
			});
			
			const php_budget_obj = budgets.find(item => item.currency === 'PHP');
			const usd_budget_obj = budgets.find(item => item.currency === 'USD');

			// Extract the actual amounts into numbers! (This fixes the React error)
			const php_budget = Number((php_budget_obj?._sum?.amount || 0).toFixed(2));
			const usd_budget = Number((usd_budget_obj?._sum?.amount || 0).toFixed(2));

			// 3. Subtract spent from budget
			const php_left = Number((php_budget - php_spent).toFixed(2));
			const usd_left = Number((usd_budget - usd_spent).toFixed(2));

			const budget = {}
			budget.php_budget = php_budget
			budget.php_spent = php_spent
			budget.php_left = php_left
			budget.usd_budget = usd_budget
			budget.usd_spent = usd_spent
			budget.usd_left = usd_left
		
			return { budget }
		})
      
      res.status(200).json({ budget: result.budget, message: 'Remaining monthly budget calculated successfully.' });
   } catch (error) {
      console.log('error: ', error);
      res.status(500).json({ message: 'Error calculating monthly budget.' });
   }
}

module.exports = dashboard_month_budget_left