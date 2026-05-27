const jwt = require('jsonwebtoken')
const { JWT_SECRET, TOKEN_TTL_SECONDS } = require('../config/auth')
const authRepo = require('../repository/authRepository')

// ── Token helpers ────────────────────────────────────────────────

/**
 * Sign an access token.
 * payload = { id, role, email, permissions }
 * permissions is an array of permission names (e.g. ['events.favorite'])
 * embedded so the client and middleware can act on them without a DB round-trip.
 */
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
async function optionalAuth(req, res, next) {
    const token = readToken(req)
    if (!token) return next()

    try {
        const decoded = verifyToken(token)

        // Fetch fresh role + permissions from the database so that
        // role/permission changes (e.g. a new permission added to the
        // admin role) take effect without requiring a re-login.
        // Falls back to decoded values if the DB is unavailable.
        let role        = decoded.role
        let permissions = decoded.permissions || []

        try {
            const user = await authRepo.findUserById(decoded.id)
            if (user?.role) {
                role        = user.role.name
                permissions = (user.role.permissions || []).map(p => p.name)
            }
        } catch (dbErr) {
            console.error('[optionalAuth] DB fetch failed, using decoded values:', dbErr.message)
        }

        req.user = {
            id:          decoded.id,
            role,
            email:       decoded.email,
            permissions
        }

        // Sliding session: reissue a fresh token on every successful auth.
        // Frontend reads X-New-Token from the response and stores it.
        const fresh = signToken({
            id:          decoded.id,
            role,
            email:       decoded.email,
            permissions
        })
        res.setHeader('X-New-Token', fresh)
        res.setHeader('Access-Control-Expose-Headers', 'X-New-Token')
    } catch {
        //protected routes will 401 via requireAuth.
    }
    next()
}


function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' })
    }
    next()
}

module.exports = { optionalAuth, requireAuth, signToken, verifyToken }
