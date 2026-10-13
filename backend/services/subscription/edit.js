const { delete_cache } = require('../../utils/redis')

async function edit_subscription(req, res, prisma) {
	const { sub_id, new_sub_name, new_sub_amount, new_sub_currency, new_sub_is_active, new_sub_month, new_sub_day, new_sub_category_id, new_sub_duration } = req.body 

	if(typeof new_sub_name !== 'string' || new_sub_name.trim().length === 0) return res.status(400).json({ message: 'Invalid name.' })  
	if(typeof new_sub_currency !== 'string' || new_sub_currency.trim().length === 0) return res.status(400).json({ message: 'Invalid currency.' })  
	if(typeof new_sub_is_active !== 'boolean') return res.status(400).json({ message: 'Invalid checkbox.' })  
	if(typeof new_sub_month !== 'string' || new_sub_month.trim().length === 0) return res.status(400).json({ message: 'Invalid month.' })  
	if(typeof new_sub_day !== 'number' || new_sub_day.length === 0) return res.status(400).json({ message: 'Invalid day.' })  
	if(typeof new_sub_category_id !== 'number' || new_sub_category_id.length === 0) return res.status(400).json({ message: 'Invalid category.' })  
	if(typeof new_sub_duration !== 'string' || new_sub_duration.trim().length === 0) return res.status(400).json({ message: 'Invalid duration.' })  
	
	const month_name = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	// Build the last due date from the actual input
	const month_index = month_name.indexOf(new_sub_month) + 1
	let base_date = new Date(today.getFullYear(), month_index, new_sub_day)
	// If that lands in the future this year, it must have been last year instead
	if (base_date > today) base_date.setFullYear(base_date.getFullYear() - 1)
	// Advance one cycle at a time until we pass today
	const next_date = new Date(base_date)
	while (next_date < today) {
		switch (new_sub_duration) {
			case 'weekly': next_date.setDate(next_date.getDate() + 7); break
			case 'monthly': next_date.setMonth(next_date.getMonth() + 1); break
			case 'yearly': next_date.setFullYear(next_date.getFullYear() + 1); break
		}
	}
	const new_date_string = `${next_date.getFullYear()}-${String(next_date.getMonth() + 1).padStart(2, '0')}-${String(next_date.getDate()).padStart(2, '0')}T00:00:00.000Z`
	
	try {
		await prisma.subscription.update({ 
			where: { id: sub_id, user_id: req.user.id }, 
			data: {
				name: new_sub_name,
				amount: new_sub_amount,
				category_id: new_sub_category_id === 0 ? null : new_sub_category_id,
				next_billing_date: new_date_string,
				currency: new_sub_currency,
				is_active: new_sub_is_active,
				duration: new_sub_duration
			}
		})

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

		res.status(200).json({ message: 'Subscription updated successfully.' })
	} catch (error) {
		console.error(error)
		res.status(500).json({ message: 'Error updating subscription.' })
	}
}

module.exports = edit_subscription