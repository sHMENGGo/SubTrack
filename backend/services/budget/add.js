const { delete_cache } = require('../../utils/redis')

async function add_budget(req, res, prisma) {
   const { budget_amount, category_id, input_month_index, input_year, toggle } = req.body
	
	if(typeof budget_amount !== 'number' || budget_amount.length === 0) return res.status(400).json({ message: 'Invalid amount.' })  
	if(typeof category_id !== 'number' || category_id.length === 0) return res.status(400).json({ message: 'Invalid category.' })  
	if(typeof input_month_index !== 'number' || input_month_index.length === 0) return res.status(400).json({ message: 'Invalid month.' })  
	if(typeof input_year !== 'number' || input_year.length === 0) return res.status(400).json({ message: 'Invalid year.' })  
	if(typeof toggle !== 'string' || toggle.trim().length === 0) return res.status(400).json({ message: 'Invalid currency.' })  
	
	try {
		await prisma.budget.create({ data: {
			amount: budget_amount,
			category_id: category_id,
			month: input_month_index + 1,
			year: input_year,
			user_id: req.user.id,
			currency: toggle
		} })

		// Delete cache because the data change
		await delete_cache(`budgets:${req.user.id}`)
		await delete_cache(`total_budget:${req.user.id}`)
		await delete_cache(`total_budget_left:${req.user.id}:*`)
		await delete_cache(`category_spent:${req.user.id}:*`)
		await delete_cache(`budget_summary:${req.user.id}:*`)
		await delete_cache(`category_budget:${req.user.id}:*`)

		res.status(201).json({ message: 'Budget added successfully.' })
	} catch (error) {
		console.error(error)
		res.status(500).json({ message: 'Error adding budget.' })
	}
}

module.exports = add_budget