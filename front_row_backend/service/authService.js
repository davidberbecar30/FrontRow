const crypto   = require('crypto')
const bcrypt   = require('bcrypt')
const jwt      = require('jsonwebtoken')
const authRepo = require('../repository/authRepository')
const { signToken } = require('../middleware/authenticate')
const {
    REFRESH_TOKEN_TTL_DAYS,
    RESET_TOKEN_TTL_MINUTES,
    LOGIN_CODE_TTL_MINUTES,
    LOGIN_TOKEN_TTL_SECONDS,
    LOGIN_TOKEN_SECRET
} = require('../config/auth')
const { sendLoginCode, sendPasswordResetEmail } = require('./emailService')

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

    // ── Local login (Step 1: password verification → sends 2FA code) ─

    /**
     * Called after Passport's local strategy has already verified the password.
     * Generates a 6-digit 2FA code, stores it hashed in the DB, sends it via
     * email (and console), and returns a short-lived loginToken.
     */
    async sendTwoFactorCode(userInstance) {
        const userId = userInstance.id
        const email  = userInstance.email

        // ── Issue 2FA code ─────────────────────────────────────────
        const code = this._generateLoginCode()
        const codeHash = this._hashToken(code)
        const expiresAt = new Date(Date.now() + LOGIN_CODE_TTL_MINUTES * 60 * 1000)

        await authRepo.createLoginCode({ userId, codeHash, expiresAt })

        // Send the code via email AND log to console for testing
        await sendLoginCode(email, code)
        console.log(`\n[2FA CODE] ${code} for ${email}\n`)

        // Issue a short-lived "login token" proving password verification
        const loginToken = jwt.sign(
            { id: userId, email },
            LOGIN_TOKEN_SECRET,
            { expiresIn: LOGIN_TOKEN_TTL_SECONDS }
        )

        const result = {
            requiresTwoFactor: true,
            loginToken,
            email
        }

        // In test mode, include the raw code so tests can complete the flow
        if (process.env.NODE_ENV === 'test') {
            result.code = code
        }

        return result
    }

    // ── Local login (password-verification path, used when passport is
    //     NOT involved, e.g. direct service calls) ────────────────────

    async login(email, password) {
        const existingUser = await authRepo.findUserByEmail(email)
        if (!existingUser) return null

        const match = await bcrypt.compare(password, existingUser.password)
        if (!match) return null

        // Password verified — delegate to sendTwoFactorCode
        return this.sendTwoFactorCode(existingUser)
    }

    // ── 2FA: verify login code (Step 2: code → full auth tokens) ────

    async verifyLoginCode(loginToken, code) {
        // 1. Verify the login token
        let payload
        try {
            payload = jwt.verify(loginToken, LOGIN_TOKEN_SECRET)
        } catch {
            const err = new Error('Login session expired. Please log in again.')
            err.status = 401
            throw err
        }

        // 2. Verify the 2FA code
        const codeHash = this._hashToken(code)
        const record = await authRepo.findValidLoginCode(codeHash)
        if (!record) {
            const err = new Error('Invalid or expired verification code')
            err.status = 401
            throw err
        }

        // Ensure the code belongs to this user
        if (record.userId !== payload.id) {
            const err = new Error('Invalid verification code')
            err.status = 401
            throw err
        }

        // 3. Mark code as used
        await authRepo.markLoginCodeUsed(codeHash)

        // 4. Issue full auth tokens
        const user = await authRepo.findUserById(payload.id)
        if (!user) {
            const err = new Error('User not found')
            err.status = 401
            throw err
        }

        return this._authResult(user)
    }

    // ── OAuth login / auto-register ──────────────────────────────────
    // Called after Passport has verified the OAuth profile and found/created
    // the user record. We just need to issue tokens.
    // OAuth bypasses 2FA since the external provider already verifies identity.

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

        const resetLink = `http://localhost:5173/reset-password?token=${rawToken}`
        console.log(`\n[PASSWORD RESET] Link for ${email}:\n${resetLink}\n`)

        // Also send via email
        await sendPasswordResetEmail(email, resetLink)

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
     * Generate a random 6-digit login code (as string, zero-padded).
     */
    _generateLoginCode() {
        const raw = crypto.randomInt(0, 1_000_000)
        return String(raw).padStart(6, '0')
    }

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
