const authService = require('../service/authService')
const passport    = require('../config/passport')

class AuthController {

    // ── POST /auth/register ──────────────────────────────────────────
    async register(req, res, next) {
        try {
            const { firstName, lastName, email, password, dateOfBirth } = req.body

            if (!firstName || !lastName || !email || !password || !dateOfBirth) {
                return res.status(400).json({ message: 'Missing required fields' })
            }

            const result = await authService.register({
                firstName, lastName, email, password, dateOfBirth
            })

            // result = { user, token, refreshToken }
            return res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    }

    // ── POST /auth/login (Strategy 1: Local, via Passport) ───────────
    login(req, res, next) {
        passport.authenticate('local', { session: false }, async (err, user, info) => {
            if (err)   return next(err)
            if (!user) return res.status(401).json({ message: info?.message || 'Invalid credentials' })

            try {
                // Step 1: Passport already verified password → generate & send 2FA code
                const result = await authService.sendTwoFactorCode(user)
                return res.status(200).json(result)
            } catch (e) {
                return next(e)
            }
        })(req, res, next)
    }

    // ── POST /auth/verify-login-code (2FA Step 2) ────────────────────
    // Body: { loginToken, code }
    async verifyLoginCode(req, res, next) {
        try {
            const { loginToken, code } = req.body
            if (!loginToken || !code) {
                return res.status(400).json({ error: 'loginToken and code are required' })
            }

            const result = await authService.verifyLoginCode(loginToken, code)
            return res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    }

    // ── GET /auth/me ─────────────────────────────────────────────────
    async me(req, res, next) {
        try {
            if (!req.user) return res.status(401).json({ error: 'Not authenticated' })
            const user = await authService.getCurrentUser(req.user.id)
            if (!user)  return res.status(401).json({ error: 'User not found' })
            return res.status(200).json({ user })
        } catch (err) {
            next(err)
        }
    }

    // ── POST /auth/refresh ───────────────────────────────────────────
    // Body: { refreshToken: "<raw>" }
    // Returns a rotated { user, token, refreshToken } pair
    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body
            if (!refreshToken) {
                return res.status(400).json({ error: 'refreshToken is required' })
            }

            const result = await authService.refresh(refreshToken)
            if (!result) {
                return res.status(401).json({ error: 'Invalid or expired refresh token' })
            }

            return res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    }

    // ── POST /auth/logout ────────────────────────────────────────────
    // Body (optional): { refreshToken: "<raw>" }
    // Without a refreshToken, revokes ALL sessions for the authenticated user.
    async logout(req, res, next) {
        try {
            const { refreshToken } = req.body || {}
            const userId = req.user?.id   // populated by optionalAuth if an access token was sent

            await authService.logout(refreshToken, userId)
            return res.status(200).json({ message: 'Logged out successfully' })
        } catch (err) {
            next(err)
        }
    }

    // ── POST /auth/forgot-password ───────────────────────────────────
    // Body: { email }
    // Always returns 200 — never leaks whether the email is registered.
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body
            if (!email) {
                return res.status(400).json({ error: 'email is required' })
            }

            await authService.forgotPassword(email)
            return res.status(200).json({
                message: 'If that email is registered, a reset link has been sent.'
            })
        } catch (err) {
            next(err)
        }
    }

    // ── POST /auth/reset-password ────────────────────────────────────
    // Body: { token, newPassword }
    async resetPassword(req, res, next) {
        try {
            const { token, newPassword } = req.body
            if (!token || !newPassword) {
                return res.status(400).json({ error: 'token and newPassword are required' })
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters' })
            }

            await authService.resetPassword(token, newPassword)
            return res.status(200).json({ message: 'Password reset successfully. Please log in again.' })
        } catch (err) {
            next(err)
        }
    }

    // ── Strategy 2: Google OAuth ─────────────────────────────────────

    // GET /auth/google — redirects browser to Google consent screen
    googleInit(req, res, next) {
        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(503).json({ error: 'Google OAuth is not configured on this server' })
        }
        passport.authenticate('google', {
            scope: ['profile', 'email'],
            session: false
        })(req, res, next)
    }

    // GET /auth/google/callback — Google redirects here after user consents
    googleCallback(req, res, next) {
        passport.authenticate('google', { session: false }, async (err, user, info) => {
            if (err)   return next(err)
            if (!user) return res.status(401).json({ message: info?.message || 'Google authentication failed' })

            try {
                const result = await authService.oauthLogin(user)
                // Production: redirect to frontend with tokens. API mode: return JSON.
                return res.status(200).json(result)
            } catch (e) {
                return next(e)
            }
        })(req, res, next)
    }

    // ── Strategy 3: GitHub OAuth ─────────────────────────────────────

    // GET /auth/github — redirects browser to GitHub consent screen
    githubInit(req, res, next) {
        if (!process.env.GITHUB_CLIENT_ID) {
            return res.status(503).json({ error: 'GitHub OAuth is not configured on this server' })
        }
        passport.authenticate('github', {
            scope: ['user:email'],
            session: false
        })(req, res, next)
    }

    // GET /auth/github/callback — GitHub redirects here after user consents
    githubCallback(req, res, next) {
        passport.authenticate('github', { session: false }, async (err, user, info) => {
            if (err)   return next(err)
            if (!user) return res.status(401).json({ message: info?.message || 'GitHub authentication failed' })

            try {
                const result = await authService.oauthLogin(user)
                return res.status(200).json(result)
            } catch (e) {
                return next(e)
            }
        })(req, res, next)
    }
}

module.exports = new AuthController()
