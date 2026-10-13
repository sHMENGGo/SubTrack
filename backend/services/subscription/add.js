const { delete_cache } = require('../../utils/redis')

async function add_subscription(req, res, prisma) {
	const { sub_name, sub_amount, sub_currency, sub_month, sub_day, sub_category_id, sub_duration } = req.body
	
	if(typeof sub_name !== 'string' || sub_name.trim().length === 0) return res.status(400).json({ message: 'Invalid name.' })  
	if(typeof sub_amount !== 'number' || sub_amount.length === 0) return res.status(400).json({ message: 'Invalid amount.' })  
	if(typeof sub_currency !== 'string' || sub_currency.trim().length === 0) return res.status(400).json({ message: 'Invalid currency.' })  
	if(typeof sub_month !== 'string' || sub_month.trim().length === 0) return res.status(400).json({ message: 'Invalid month.' })  
	if(typeof sub_day !== 'number' || sub_day.length === 0) return res.status(400).json({ message: 'Invalid day.' })  
	if(typeof sub_category_id !== 'number' || sub_category_id.length === 0) return res.status(400).json({ message: 'Invalid category.' })  
	if(typeof sub_duration !== 'string') return res.status(400).json({ message: 'Invalid duration.' })  
	
	const month_name = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	const today = new Date()
	today.setDate(sub_day)
	today.setHours(0, 0, 0, 0)

	const month_index = month_name.indexOf(sub_month) + 1
	let base_date = new Date(today.getFullYear(), month_index, sub_day)

	if (base_date > today) base_date.setFullYear(base_date.getFullYear() - 1)
	const next_date = new Date(base_date)
	while (next_date < today) {
		switch (sub_duration) {
			case 'weekly': next_date.setDate(next_date.getDate() + 7); break
			case 'monthly': next_date.setMonth(next_date.getMonth() + 1); break
			case 'yearly': next_date.setFullYear(next_date.getFullYear() + 1); break
		}
	}
	// Format the date to YYYY-MM-DD
	const date_string = `${today.getFullYear()}-${String(next_date.getMonth() + 1).padStart(2,'0')}-${String(next_date.getDate()).padStart(2,'0')}T00:00:00.000Z`
	try {
		const sub = await prisma.subscription.findFirst({ where: { name: sub_name, user_id: req.user.id } })
		if(sub) return res.status(400).json({ message: 'Subscription already exist.' })

		await prisma.subscription.create({ data: {
			name: sub_name,
			amount: sub_amount,
			next_billing_date: date_string,
			user_id: req.user.id,
			category_id: sub_category_id === 0 ? null : sub_category_id,
			currency: sub_currency,
			duration: sub_duration
		} })

		// Delete cache because the data change
		await delete_cache(`subscriptions:${req.user.id}:*`)
		await delete_cache(`monthly_spends:${req.user.id}`)
		await delete_cache(`total_active_subs:${req.user.id}`)
		await delete_cache(`total_due_1_week:${req.user.id}:*`)
		await delete_cache(`total_budget_left:${req.user.id}:*`)
		await delete_cache(`renewals:${req.user.id}:*`)
		await delete_cache(`category_spent:${req.user.id}:*`)
		await delete_cache(`budget_summary:${req.user.id}:*`)
		await delete_cache(`category_budget:${req.user.id}:*`)

		res.status(201).json({ message: 'Subscription added successfully.' })
	} catch (error) {
		console.error(error)
		res.status(500).json({ message: 'Error adding subscription.' })
	}
}

module.exports = add_subscription