const { get_or_set_cache } = require('../utils/redis')

async function history(req, res, prisma) {
   const { filter_category, filter_days } = req.body
	if (typeof filter_days !== 'string') return res.status(400).json({ message: 'Invalid day.' })

	const month_name = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
	const today = new Date();
	const today_year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, '0');
	const month_start = new Date(`${today_year}-${month}-01T00:00:00.000Z`);
	const year_start = new Date(`${today_year}-01-01T00:00:00.000Z`);

	const where_query = { user_id: req.user.id }
	if (filter_category === 0) where_query.subscription = { category: null }
	if (filter_category !== "" && filter_category !== undefined) where_query.subscription = { category: { id: filter_category } }

	if (filter_days === '30') {
		const thirty_days_ago = new Date();
		thirty_days_ago.setDate(thirty_days_ago.getDate() - 30);
		where_query.billing_date = { gte: thirty_days_ago };
	} else if (filter_days === '90') {
		const ninety_days_ago = new Date();
		ninety_days_ago.setDate(ninety_days_ago.getDate() - 90);
		where_query.billing_date = { gte: ninety_days_ago };
	} else if (filter_days === 'year') {
		where_query.billing_date = { gte: year_start };
	}

	const cache_key = `histories:${req.user.id}:${filter_category}:${filter_days}`
	try {
		const result = await get_or_set_cache(cache_key, 120, async () => {
			const histories = await prisma.paymentHistory.findMany({
				where: where_query,
				include: {
					subscription: {
						include: { category: { select: { id: true, name: true, color_hex: true } } }
					}
				},
				orderBy: { billing_date: 'desc' }
			})

			const month_amount = { php: 0, usd: 0 };
			const year_amount = { php: 0, usd: 0 };

			histories.forEach(history => {
				const billing_date = new Date(history.billing_date);
				const currency = history.currency.toLowerCase()
				if (billing_date < today) {
					const amount = Number(history.amount);
					if (billing_date >= month_start) month_amount[currency] += amount
					if (billing_date >= year_start) year_amount[currency] += amount
				}
			})

			const groups = histories.reduce((acc, history) => {
				const billing_date = new Date(history.billing_date)
				const group_key = `${month_name[billing_date.getMonth()]} ${billing_date.getFullYear()}`
				const month_day = month_name[billing_date.getMonth()] + ' ' + String(billing_date.getDate()).padStart(2, '0')

				if (!acc[group_key]) acc[group_key] = []
				acc[group_key].push({ ...history, month_day })

				return acc
			}, {})

			return { groups, month_amount, year_amount }
		})

		res.status(200).json({
			formatted_histories: result.groups,
			month_amount: result.month_amount,
			year_amount: result.year_amount
		});
	} catch (error) {
		console.error('Error retrieving history: ', error);
		res.status(500).json({ message: 'Error retrieving subscription history.' });
	}
}

module.exports = history