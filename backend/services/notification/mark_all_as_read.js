const { delete_cache } = require('../../utils/redis')

async function notification_mark_all_as_read(req, res, prisma) {
   try {
		await prisma.notification.updateMany({
			where: { user_id: req.user.id, is_read: false },
			data: { is_read: true }
		})

		// Delete cache because the data change
		await delete_cache(`notifications_today:${req.user.id}`)
		await delete_cache(`notifications:${req.user.id}`)

		res.status(200).json({ message: 'Successfully marked all as read' })
	} catch (error) {
		console.log('Error marking all as read: ', error)
		res.status(500).json({ message: 'Error marking all as read.' })
	}
}

module.exports = notification_mark_all_as_read