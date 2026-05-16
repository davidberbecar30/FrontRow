const authService = require('../service/authService')

class AuthController {

    async register(req, res, next) {
        try {
            const { firstName, lastName, email, password, dateOfBirth } = req.body

            if (!firstName || !lastName || !email || !password || !dateOfBirth) {
                return res.status(400).json({ message: 'Missing required fields' })
            }

            const user = await authService.register({
                firstName,
                lastName,
                email,
                password,
                dateOfBirth
            })

            return res.status(201).json(user)
        } catch (err) {
            next(err)
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body

            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' })
            }

            const user = await authService.login(email, password)

            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' })
            }

            return res.status(200).json(user)
        } catch (err) {
            next(err)
        }
    }
}

module.exports = new AuthController()
