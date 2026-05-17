// Central config for JWT + session lifetime.
// In production, all secrets MUST come from .env — never commit real values.

require('dotenv').config({
    path: process.env.NODE_ENV === 'test' ? '.env.tests' : '.env'
})

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-fallback-secret-CHANGE-IN-PROD'

// Access token: short-lived (15 min). Active users get a fresh one on every
// authenticated request via the X-New-Token sliding-session header.
const TOKEN_TTL_SECONDS = 15 * 60

// Refresh token: long-lived (7 days), stored hashed in the DB.
// Used by POST /auth/refresh to issue a new access token without re-login.
const REFRESH_TOKEN_TTL_DAYS = 7

// Password-reset token: single-use, expires in 1 hour.
const RESET_TOKEN_TTL_MINUTES = 60

// OAuth — set these in .env when you have real OAuth apps registered
const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const GOOGLE_CALLBACK_URL  = process.env.GOOGLE_CALLBACK_URL  || 'http://localhost:3000/auth/google/callback'

const GITHUB_CLIENT_ID     = process.env.GITHUB_CLIENT_ID     || ''
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || ''
const GITHUB_CALLBACK_URL  = process.env.GITHUB_CALLBACK_URL  || 'http://localhost:3000/auth/github/callback'

module.exports = {
    JWT_SECRET,
    TOKEN_TTL_SECONDS,
    REFRESH_TOKEN_TTL_DAYS,
    RESET_TOKEN_TTL_MINUTES,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_CALLBACK_URL
}
