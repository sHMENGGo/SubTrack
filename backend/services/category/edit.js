const { delete_cache } = require('../../utils/redis')

async function edit_category(req, res, prisma) {
   const { category_id, new_category_name, new_category_color } = req.body

	if(typeof category_id !== 'number' || category_id.length === 0) return res.status(400).json({ message: 'Invalid category.' })  
	if(typeof new_category_name !== 'string' || new_category_name.trim().length === 0) return res.status(400).json({ message: 'Invalid name.' })  
	if(typeof new_category_color !== 'string' || new_category_color.trim().length === 0) return res.status(400).json({ message: 'Invalid color.' })  

	try {
		await prisma.category.update({ 
			where: { id: category_id, user_id: req.user.id }, 
			data: { 
				name: new_category_name,
				color_hex: new_category_color
			} 
		})

		// Delete cache because the data change
		await delete_cache(`categories:${req.user.id}`)
		await delete_cache(`category_spent:${req.user.id}:*`)
		await delete_cache(`category_summary:${req.user.id}`)
		await delete_cache(`category_budget:${req.user.id}:*`)

		res.status(200).json({ message: 'Category updated successfully.' })
	} catch (error) {res.status(500).json({ message: 'Error updating category.' })}
}

module.exports = edit_category