const express = require('express')
const router  = express.Router()
const ctrl    = require('../controller/authController')
const { requireAuth } = require('../middleware/authenticate')

// ── Strategy 1: Local auth ───────────────────────────────────────────────────
router.post('/register',              ctrl.register.bind(ctrl))
router.post('/verify-register-code', ctrl.verifyRegisterCode.bind(ctrl))
router.post('/login',                ctrl.login.bind(ctrl))
router.post('/verify-login-code',    ctrl.verifyLoginCode.bind(ctrl))
router.get('/me',                  requireAuth, ctrl.me.bind(ctrl))

// ── Session management ───────────────────────────────────────────────────────
router.post('/refresh',            ctrl.refresh.bind(ctrl))     // rotate refresh token → new access+refresh
router.post('/logout',             ctrl.logout.bind(ctrl))      // revoke refresh token(s)

// ── Password recovery ────────────────────────────────────────────────────────
router.post('/forgot-password',    ctrl.forgotPassword.bind(ctrl))
router.post('/reset-password',     ctrl.resetPassword.bind(ctrl))

// ── Strategy 2: Google OAuth 2.0 ────────────────────────────────────────────
router.get('/google',              ctrl.googleInit.bind(ctrl))
router.get('/google/callback',     ctrl.googleCallback.bind(ctrl))

// ── Strategy 3: GitHub OAuth ─────────────────────────────────────────────────
router.get('/github',              ctrl.githubInit.bind(ctrl))
router.get('/github/callback',     ctrl.githubCallback.bind(ctrl))

module.exports = router
