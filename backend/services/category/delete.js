const { delete_cache } = require('../../utils/redis')

async function delete_category(req, res, prisma) {
   const { category_id } = req.body
	if(typeof category_id !== 'number' || category_id.length === 0) return res.status(400).json({ message: 'Invalid category.' })  

	try {
		await prisma.category.delete({ where: { id: category_id, user_id: req.user.id } })
		
		// Delete cache because the data change
		await delete_cache(`categories:${req.user.id}`)
		await delete_cache(`category_spent:${req.user.id}:*`)
		await delete_cache(`category_summary:${req.user.id}`)
		await delete_cache(`category_budget:${req.user.id}:*`)

		res.status(200).json({ message: 'Category deleted successfully.' })
	} catch (error) {res.status(500).json({ message: 'Error deleting category.' })}
}

module.exports = delete_category