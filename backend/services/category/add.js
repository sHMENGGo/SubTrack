const { delete_cache } = require('../../utils/redis')

async function add_category(req, res, prisma) {
   const { category_name, category_color } = req.body
	if(typeof category_name !== 'string' || category_name.trim().length === 0) return res.status(400).json({ message: 'Invalid name.' })  
	if(typeof category_color !== 'string' || category_color.trim().length === 0) return res.status(400).json({ message: 'Invalid color.' })  
	
	try {
		const category = await prisma.category.findFirst({ where: { name: category_name, user_id: req.user.id } })
		if(category) return res.status(400).json({ message: 'Category already exist.' })  

		await prisma.category.create({ data: {
			name: category_name,
			color_hex: category_color,
			user_id: req.user.id
		} })

		// Delete cache because the data change
		await delete_cache(`categories:${req.user.id}`)
		await delete_cache(`category_spent:${req.user.id}:*`)
		await delete_cache(`category_summary:${req.user.id}`)
		await delete_cache(`category_budget:${req.user.id}:*`)

		res.status(201).json({ message: 'Category added successfully.' })
	} catch (error) {res.status(500).json({ message: 'Error adding category.' })}
}

module.exports = add_category