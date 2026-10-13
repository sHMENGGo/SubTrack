const { get_or_set_cache } = require('../../utils/redis')

async function get_subscription(req, res, prisma) {
   const { filter_category, filter_status } = req.body
   
	if(typeof filter_status !== 'string') return res.status(400).json({ message: 'Invalid status.' })  
	const month_name = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

	const cache_key = `subscriptions:${req.user.id}:${filter_category ?? 'none'}:${filter_status}`
	try {
		const result = await get_or_set_cache(cache_key, 120, async ()=> {
			const subscriptions = await prisma.subscription.findMany({ 
				where: { 
					user_id: req.user.id,
					category_id: filter_category === 0 ? null : (filter_category || undefined),
					is_active: filter_status === 'all' ? undefined : filter_status === 'true' ? true : filter_status === 'false' ? false : undefined
				},
				include: { category: { select: { name: true, color_hex: true } } },
				orderBy: { next_billing_date: 'asc' }
			})
			
			const formatted_subs = subscriptions.map(sub => {
				const bill_date = new Date(sub.next_billing_date)
				switch(sub.duration){
					case 'weekly': bill_date.setDate(bill_date.getDate() - 7); break
					case 'monthly': bill_date.setMonth(bill_date.getMonth() - 1); break
					case 'yearly': bill_date.setFullYear(bill_date.getFullYear() - 1); break
				}

				const prev_month = month_name[bill_date.getMonth()]
				const prev_day = bill_date.getDate()
				const prev_year = bill_date.getFullYear()
				
				return {
					...sub,
					amount: Number(sub.amount).toFixed(2),
					prev_month,
					prev_day,
					prev_year,
					month: month_name[sub.next_billing_date.getMonth()],
					day: String(sub.next_billing_date.getDate()).padStart(2, '0'),
					year: String(sub.next_billing_date.getFullYear())
				}
			})

			return { formatted_subs }
		})
		
		res.status(200).json({ subscriptions: result.formatted_subs, message: 'Subscriptions retrieved successfully.' })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Error retrieving subscriptions.' })
	}
}

module.exports = get_subscription