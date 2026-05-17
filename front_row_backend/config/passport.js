
const passport         = require('passport')
const LocalStrategy    = require('passport-local').Strategy
const GoogleStrategy   = require('passport-google-oauth20').Strategy
const GitHubStrategy   = require('passport-github2').Strategy
const bcrypt           = require('bcrypt')
const authRepo         = require('../repository/authRepository')
const {
    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL,
    GITHUB_CLIENT_ID,  GITHUB_CLIENT_SECRET,  GITHUB_CALLBACK_URL
} = require('./auth')

// ── Strategy 1: Local ────────────────────────────────────────────────────────
// Looks up user by email, compares bcrypt hash.
passport.use(new LocalStrategy(
    { usernameField: 'email', passwordField: 'password', session: false },
    async (email, password, done) => {
        try {
            const user = await authRepo.findUserByEmail(email)
            if (!user) return done(null, false, { message: 'Invalid credentials' })

            const match = await bcrypt.compare(password, user.password)
            if (!match) return done(null, false, { message: 'Invalid credentials' })

            return done(null, user)
        } catch (err) {
            return done(err)
        }
    }
))

// ── Strategy 2: Google OAuth 2.0 ────────────────────────────────────────────
// Finds or creates a user from the Google profile.
// If no Google credentials are configured, the strategy is still registered but
// the routes that use it will return a 503 until the env vars are set.
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy(
        {
            clientID:     GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL:  GOOGLE_CALLBACK_URL,
            session:      false
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value
                if (!email) return done(null, false, { message: 'No email from Google' })

                let user = await authRepo.findUserByEmail(email)

                if (!user) {
                    // Auto-register: new users from OAuth get the default 'user' role
                    const defaultRole = await authRepo.findRoleByName('user')
                    const tempPassword = await bcrypt.hash(Math.random().toString(36), 10)
                    user = await authRepo.createUser({
                        firstName:   profile.name?.givenName  || profile.displayName || 'Google',
                        lastName:    profile.name?.familyName || 'User',
                        email,
                        password:    tempPassword,   // not usable — OAuth users must reset if they want local login
                        dateOfBirth: '1900-01-01',   // placeholder; prompt user to update in profile
                        roleId:      defaultRole.id
                    })
                    user = await authRepo.findUserById(user.id)
                }

                return done(null, user)
            } catch (err) {
                return done(err)
            }
        }
    ))
}

// ── Strategy 3: GitHub OAuth ─────────────────────────────────────────────────
if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy(
        {
            clientID:     GITHUB_CLIENT_ID,
            clientSecret: GITHUB_CLIENT_SECRET,
            callbackURL:  GITHUB_CALLBACK_URL,
            scope:        ['user:email'],
            session:      false
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value
                if (!email) return done(null, false, { message: 'No email from GitHub — make your email public.' })

                let user = await authRepo.findUserByEmail(email)

                if (!user) {
                    const defaultRole = await authRepo.findRoleByName('user')
                    const tempPassword = await bcrypt.hash(Math.random().toString(36), 10)
                    const nameParts = (profile.displayName || 'GitHub User').split(' ')
                    user = await authRepo.createUser({
                        firstName:   nameParts[0] || 'GitHub',
                        lastName:    nameParts.slice(1).join(' ') || 'User',
                        email,
                        password:    tempPassword,
                        dateOfBirth: '1900-01-01',
                        roleId:      defaultRole.id
                    })
                    user = await authRepo.findUserById(user.id)
                }

                return done(null, user)
            } catch (err) {
                return done(err)
            }
        }
    ))
}

module.exports = passport
