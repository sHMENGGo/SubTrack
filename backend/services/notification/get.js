const { get_or_set_cache } = require('../../utils/redis')

async function notification(req, res, prisma) {
   const month_name = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	const cache_key = `notifications:${req.user.id}`
	try {
		const result = await get_or_set_cache(cache_key, 300, async ()=> {
			const notifications = await prisma.notification.findMany({ 
				where: { user_id: req.user.id },
				include: { subscription: true },
				orderBy: { notify_at: 'desc' }
			})
			const formatted_notifications = notifications.map(notif => ({
				...notif, 
				amount: Number(notif.subscription.amount).toFixed(2),
				month: month_name[notif.subscription.next_billing_date.getMonth()],
				day: String(notif.subscription.next_billing_date.getDate()).padStart(2, 0)
			}))

			let notif_count = 0
			for(let notif of formatted_notifications) {if(notif.is_read === false) notif_count = notif_count + 1}
		
			return{ formatted_notifications, notif_count }
		})
		
		res.status(200).json({ 
			formatted_notifications: result.formatted_notifications, 
			notif_count: result.notif_count 
		})
	} catch (error) {
		console.error('Error retrieving notifications: ', error)
		res.status(500).json({ message: 'Error retrieving notifications.' })
	}
}

module.exports = notification