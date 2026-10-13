const { delete_cache } = require('../../utils/redis')

async function delete_notification(req, res, prisma) {
   const { notification_id } = req.body
	if(typeof notification_id !== 'string' || notification_id.trim().length === 0) return res.status(400).json({ message: 'Invalid notification.' })  
	try {
		await prisma.notification.delete({ where: { id: notification_id, user_id: req.user.id } })
		
		// Delete cache because the data change
		await delete_cache(`notifications_today:${req.user.id}`)
		await delete_cache(`notifications:${req.user.id}`)

		res.status(200).json({ message: 'Notification deleted successfully.' })
	} catch (error) {res.status(500).json({ message: 'Error deleting notification.' })}
}

module.exports = delete_notification