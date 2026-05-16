const jwt = require('jsonwebtoken')
const { JWT_SECRET, TOKEN_TTL_SECONDS } = require('../config/auth')

// ── Token helpers ────────────────────────────────────────────────

function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS })
}

function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET)
}

function readToken(req) {
    const header = req.headers['authorization'] || ''
    const match = header.match(/^Bearer\s+(.+)$/i)
    return match ? match[1] : null
}

// ── Middleware: optional auth ────────────────────────────────────
// Reads the token if present and attaches req.user. Never blocks the
// request. Used globally so public routes still work and so logAction
// can attribute requests it sees.
function optionalAuth(req, res, next) {
    const token = readToken(req)
    if (!token) return next()

    try {
        const decoded = verifyToken(token)
        req.user = {
            id:    decoded.id,
            role:  decoded.role,
            email: decoded.email
        }
        // Sliding session: reissue a fresh token on every successful auth.
        // Frontend reads X-New-Token from the response and stores it.
        const fresh = signToken({ id: decoded.id, role: decoded.role, email: decoded.email })
        res.setHeader('X-New-Token', fresh)
        res.setHeader('Access-Control-Expose-Headers', 'X-New-Token')
    } catch {
        // Expired or tampered — silently ignore. Protected routes will 401 via requireAuth.
    }
    next()
}

// ── Middleware: required auth ────────────────────────────────────
// Use on protected endpoints. Sends 401 if optionalAuth didn't populate req.user.
function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' })
    }
    next()
}

module.exports = { optionalAuth, requireAuth, signToken, verifyToken }
