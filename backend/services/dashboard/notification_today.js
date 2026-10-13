const { get_or_set_cache } = require('../../utils/redis')

async function notification_today(req, res, prisma) {
   const month_name = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	
	const today_start_string = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z'
	const today_start = new Date(today_start_string)

	const today_end_string = new Date().toISOString().split('T')[0] + 'T23:59:59.999Z'
	const today_end = new Date(today_end_string)
	
	const cache_key = `notifications_today:${req.user.id}`
	try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			const notifications = await prisma.notification.findMany({ 
				where: { user_id: req.user.id, notify_at: { gte: today_start, lte: today_end }},
				include: { subscription: true },
				orderBy: { notify_at: 'desc' }
			})

			const formatted_notifications = notifications.map(notif => ({
				...notif, 
				amount: Number(notif.subscription.amount).toFixed(2),
				month: month_name[notif.subscription.next_billing_date.getMonth()],
				day: String(notif.subscription.next_billing_date.getDate()).padStart(2, 0)
			}))

			return { formatted_notifications }
		})

		res.status(200).json({ formatted_notifications: result.formatted_notifications })
	} catch (error) {
		console.error('Error retrieving notifications today: ', error)
		res.status(500).json({ message: 'Error retrieving notifications today.' })
	}
}

module.exports = notification_today