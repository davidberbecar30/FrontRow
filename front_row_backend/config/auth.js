// Central config for JWT + session lifetime.
// In production, JWT_SECRET MUST come from .env — never commit a real secret.

require('dotenv').config({
    path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
})

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-fallback-secret-CHANGE-IN-PROD'

// Token TTL — 30 minutes of inactivity = logout.
// Each authenticated request reissues a fresh token, so active users stay logged in.
const TOKEN_TTL_SECONDS = 30 * 60

module.exports = { JWT_SECRET, TOKEN_TTL_SECONDS }
