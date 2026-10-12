
async function logout(req, res) {
   try {
		res.clearCookie('token', {
			httpOnly: true, 
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			// secure: true
		})
		res.status(200).json({ message: 'Logout successful!' })
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Error occurred while logging out.' })
	}
}

module.exports = { logout }