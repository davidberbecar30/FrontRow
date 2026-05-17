const crypto   = require('crypto')
const bcrypt   = require('bcrypt')
const authRepo = require('../repository/authRepository')
const { signToken } = require('../middleware/authenticate')
const {
    REFRESH_TOKEN_TTL_DAYS,
    RESET_TOKEN_TTL_MINUTES
} = require('../config/auth')

const DEFAULT_ROLE = 'user'

class AuthService {

    constructor() {}

    // ── Register ─────────────────────────────────────────────────────

    async register(userInput) {
        const existingEmail = await authRepo.findUserByEmail(userInput.email)
        if (existingEmail) {
            const err = new Error('Email already registered')
            err.status = 409
            throw err
        }

        const defaultRole = await authRepo.findRoleByName(DEFAULT_ROLE)
        if (!defaultRole) {
            const err = new Error(`Default role "${DEFAULT_ROLE}" missing — seed it first`)
            err.status = 500
            throw err
        }

        const hashedPassword = await bcrypt.hash(userInput.password, 10)
        const created = await authRepo.createUser({
            firstName:   userInput.firstName,
            lastName:    userInput.lastName,
            email:       userInput.email,
            dateOfBirth: userInput.dateOfBirth,
            password:    hashedPassword,
            roleId:      defaultRole.id
        })

        const fullUser = await authRepo.findUserById(created.id)
        return this._authResult(fullUser)
    }

    // ── Local login ──────────────────────────────────────────────────

    async login(email, password) {
        const existingUser = await authRepo.findUserByEmail(email)
        if (!existingUser) return null

        const match = await bcrypt.compare(password, existingUser.password)
        if (!match) return null

        return this._authResult(existingUser)
    }

    // ── OAuth login / auto-register ──────────────────────────────────
    // Called after Passport has verified the OAuth profile and found/created
    // the user record. We just need to issue tokens.

    async oauthLogin(userInstance) {
        const fullUser = await authRepo.findUserById(userInstance.id)
        return this._authResult(fullUser)
    }

    // ── /auth/me ─────────────────────────────────────────────────────

    async getCurrentUser(id) {
        const user = await authRepo.findUserById(id)
        if (!user) return null
        return this._sanitize(user)
    }

    // ── Session: refresh ─────────────────────────────────────────────

    async refresh(rawRefreshToken) {
        const tokenHash = this._hashToken(rawRefreshToken)
        const record    = await authRepo.findRefreshToken(tokenHash)
        if (!record) return null

        const user = await authRepo.findUserById(record.userId)
        if (!user) return null

        // Rotate: revoke old, issue a brand-new refresh + access token pair
        await authRepo.revokeRefreshToken(tokenHash)
        return this._authResult(user)
    }

    // ── Session: logout ──────────────────────────────────────────────

    async logout(rawRefreshToken, userId) {
        if (rawRefreshToken) {
            await authRepo.revokeRefreshToken(this._hashToken(rawRefreshToken))
        } else if (userId) {
            // Fallback: "logout everywhere" — revoke all sessions for this user
            await authRepo.revokeAllUserRefreshTokens(userId)
        }
    }

    // ── Password recovery: request reset ────────────────────────────

    async forgotPassword(email) {
        const user = await authRepo.findUserByEmail(email)
        // Always succeed — don't leak whether an email exists
        if (!user) return null

        const rawToken  = crypto.randomBytes(32).toString('hex')
        const tokenHash = this._hashToken(rawToken)
        const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000)

        await authRepo.createPasswordResetToken({ userId: user.id, tokenHash, expiresAt })

        // In production, send rawToken via a transactional email service.
        // For now we print it so the flow can be tested locally.
        const resetLink = `http://localhost:5173/reset-password?token=${rawToken}`
        console.log(`\n[PASSWORD RESET] Link for ${email}:\n${resetLink}\n`)

        return rawToken  // returned so integration tests can exercise the full flow
    }

    // ── Password recovery: consume reset token ───────────────────────

    async resetPassword(rawToken, newPassword) {
        const tokenHash = this._hashToken(rawToken)
        const record    = await authRepo.findPasswordResetToken(tokenHash)
        if (!record) {
            const err = new Error('Invalid or expired reset token')
            err.status = 400
            throw err
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await authRepo.updateUserPassword(record.userId, hashedPassword)
        await authRepo.markResetTokenUsed(tokenHash)

        // Revoke all sessions — force re-login after a password change
        await authRepo.revokeAllUserRefreshTokens(record.userId)
    }

    // ── Internals ────────────────────────────────────────────────────

    /**
     * Build { user, token, refreshToken }.
     *
     * The access token (JWT) embeds the full permissions array so every
     * middleware can do permission checks without a DB round-trip.
     *
     * The refresh token is a 64-byte random hex string stored hashed in the DB.
     * The raw value is returned to the client once (send it in an HttpOnly cookie
     * or the response body — never in localStorage).
     */
    async _authResult(userInstance) {
        const user        = this._sanitize(userInstance)
        const permissions = (user.role?.permissions || []).map(p => p.name)

        const token = signToken({
            id:          user.id,
            role:        user.role?.name || DEFAULT_ROLE,
            email:       user.email,
            permissions              // ← embedded so requirePermission() works without DB
        })

        // Issue refresh token
        const rawRefreshToken = crypto.randomBytes(64).toString('hex')
        const expiresAt = new Date(
            Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
        )
        await authRepo.createRefreshToken({
            userId:    user.id,
            tokenHash: this._hashToken(rawRefreshToken),
            expiresAt
        })

        return { user, token, refreshToken: rawRefreshToken }
    }

    _hashToken(raw) {
        return crypto.createHash('sha256').update(raw).digest('hex')
    }

    _sanitize(userInstance) {
        const plain = userInstance.get({ plain: true })
        delete plain.password
        return plain
    }
}

module.exports = new AuthService()
