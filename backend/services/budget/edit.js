const { delete_cache } = require('../../utils/redis')

async function edit_budget(req, res, prisma) {
   const { budget_id, new_budget_amount, input_month_index, input_year } = req.body

	if(typeof budget_id !== 'string' || budget_id.trim().length === 0) return res.status(400).json({ message: 'Invalid budget.' })  
	if(typeof input_month_index !== 'number' || input_month_index.length === 0) return res.status(400).json({ message: 'Invalid month.' })  
	if(typeof input_year !== 'number' || input_year.length === 0) return res.status(400).json({ message: 'Invalid year.' })  

	try {
		await prisma.budget.update({ 
			where: { id: budget_id, month: input_month_index + 1, year: input_year, user_id: req.user.id },
			data: { amount: new_budget_amount } 
		})

		// Delete cache because the data change
		await delete_cache(`budgets:${req.user.id}`)
		await delete_cache(`total_budget:${req.user.id}`)
		await delete_cache(`total_budget_left:${req.user.id}:*`)
		await delete_cache(`category_spent:${req.user.id}:*`)
		await delete_cache(`budget_summary:${req.user.id}:*`)
		await delete_cache(`category_budget:${req.user.id}:*`)

		res.status(200).json({ message: 'Budget updated successfully.' })
	} catch (error) {
		console.error(error)
		res.status(500).json({ message: 'Error updating budget.' })
	}
}

module.exports = edit_budget