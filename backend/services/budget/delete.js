const { delete_cache } = require('../../utils/redis')

async function delete_budget(req, res, prisma) {
   const { budget_to_delete, toggle, input_month_index, input_year } = req.body

	if(typeof budget_to_delete !== 'string' || budget_to_delete.trim().length === 0) return res.status(400).json({ message: 'Invalid budget.' })  
	if(typeof toggle !== 'string' || toggle.trim().length === 0) return res.status(400).json({ message: 'Invalid currency.' })  
	if(typeof input_month_index !== 'number' || input_month_index.length === 0) return res.status(400).json({ message: 'Invalid month.' })  
	if(typeof input_year !== 'number' || input_year.length === 0) return res.status(400).json({ message: 'Invalid year.' })  

	try {
		await prisma.budget.delete({ 
			where: { 
				id: budget_to_delete, 
				user_id: req.user.id,
				month: input_month_index + 1,
				currency: toggle,
				year: input_year
			}
		})

		// Delete cache because the data change
		await delete_cache(`budgets:${req.user.id}`)
		await delete_cache(`total_budget:${req.user.id}`)
		await delete_cache(`total_budget_left:${req.user.id}:*`)
		await delete_cache(`category_spent:${req.user.id}:*`)
		await delete_cache(`budget_summary:${req.user.id}:*`)
		await delete_cache(`category_budget:${req.user.id}:*`)

		res.status(200).json({ message: 'Budget deleted successfully.' })
	} catch (error) {
		console.error(error)
		res.status(500).json({ message: 'Error deleting budget.' })
	}
}

module.exports = delete_budget