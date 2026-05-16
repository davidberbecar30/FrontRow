const authService = require('../service/authService')

class AuthController {

    async register(req, res, next) {
        try {
            const { firstName, lastName, email, password, dateOfBirth } = req.body

            if (!firstName || !lastName || !email || !password || !dateOfBirth) {
                return res.status(400).json({ message: 'Missing required fields' })
            }

            const result = await authService.register({
                firstName, lastName, email, password, dateOfBirth
            })

            // result = { user, token }
            return res.status(201).json(result)
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

            const result = await authService.login(email, password)
            if (!result) {
                return res.status(401).json({ message: 'Invalid credentials' })
            }

            return res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    }

    // Used by the frontend on app load to re-fetch the user from a still-valid token.
    async me(req, res, next) {
        try {
            if (!req.user) return res.status(401).json({ error: 'Not authenticated' })
            const user = await authService.getCurrentUser(req.user.id)
            if (!user) return res.status(401).json({ error: 'User not found' })
            return res.status(200).json({ user })
        } catch (err) {
            next(err)
        }
    }
}

module.exports = new AuthController()
