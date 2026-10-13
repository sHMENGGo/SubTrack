const { get_or_set_cache } = require('../../utils/redis')

async function category_summary(req, res, prisma) {
   const cache_key = `category_summary:${req.user.id}`
	try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			const categories = await prisma.category.findMany({ 
				where: { user_id: req.user.id },
				include: { subscriptions: true }
			})
			const category_ids = categories.map(cat => cat.id)
			const category_amount = await prisma.subscription.groupBy({
				by: ['category_id', 'currency'],
				where: { user_id: req.user.id, category_id: { in: category_ids } },
				_sum: { amount: true }
			})
			const category_summary = categories.map(cat => {
				const php_cat_amount = category_amount.find(cat_amount => cat_amount.category_id === cat.id && cat_amount.currency === 'PHP')
				const usd_cat_amount = category_amount.find(cat_amount => cat_amount.category_id === cat.id && cat_amount.currency === 'USD')
				return {
					id: cat.id,
					name: cat.name,
					color_hex: cat.color_hex,
					subs_count: cat.subscriptions.length,
					php_sub_amount: Number(php_cat_amount?._sum?.amount || 0).toFixed(2),
					usd_sub_amount: Number(usd_cat_amount?._sum?.amount || 0).toFixed(2),
				}
			})

			return { category_summary }
		})
		
		res.status(200).json({ category_summary: result.category_summary, message: 'Category summary retrieved successfully' })
	} catch (error) {
      console.log('error: ', error)
      res.status(500).json({ message: 'Error fetching category summary.' })
   }
}

module.exports = category_summary