const { delete_cache } = require('../../utils/redis')

async function delete_subscription(req, res, prisma) {
   const { subscription_id } = req.body
	if(typeof subscription_id !== 'string' || subscription_id.trim().length === 0) return res.status(400).json({ message: 'Invalid subscription.' })  
	
	try {
		await prisma.subscription.delete({ where: { id: subscription_id, user_id: req.user.id } })
		
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

		res.status(200).json({ message: 'Subscription deleted successfully.' })
	} catch (error) {res.status(500).json({ message: 'Error deleting subscription.' })}
}

module.exports = delete_subscription