const express  = require('express')
const cors     = require('cors')
const passport = require('./config/passport')
const { createHandler } = require('graphql-http/lib/use/express')
const routes      = require('./router/router')
const schema      = require('./graphql/schema')
const resolvers   = require('./graphql/resolvers')
const ticketRoutes = require('./router/ticketRoutes')
const authRoutes   = require('./router/authRoutes')
const chatRoutes   = require('./router/chatRoutes')
const adminRoutes  = require('./router/adminRoutes')
const statsRoutes  = require('./router/statsRoutes')
const { optionalAuth } = require('./middleware/authenticate')
const logAction = require('./middleware/logAction')


const app = express()

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    // Expose the refresh-token header so the frontend can read it
    exposedHeaders: ['X-New-Token']
}))

app.use(express.json({ limit: '10mb' }))
app.use('/images', express.static('public/images'))

// Initialize Passport (stateless — no sessions, JWT only)
app.use(passport.initialize())

// Verify JWT (if present) and attach req.user. Issues a fresh token on every
// authenticated request — used by the frontend to slide the session window.
app.use(optionalAuth)

// Log every authenticated action and run malicious-behavior detectors
app.use(logAction)

app.use('/events', routes)
app.use('/auth',   authRoutes)
app.use('/chat',   chatRoutes)
app.use('/admin',  adminRoutes)
app.use('/stats',  statsRoutes)

if (process.env.NODE_ENV === 'development') {
    const fakerRoutes = require('./router/fakerRoutes')
    app.use('/faker', fakerRoutes)
}

app.use('/events/:eventId/tickets', ticketRoutes)
app.use('/tickets', ticketRoutes)

app.use('/graphql', createHandler({
    schema,
    rootValue: resolvers
}))

app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.url} not found` })
})

app.use((err, req, res, next) => {
    console.error(err.stack)
    const status = err.status || 500
    res.status(status).json({ error: err.message || 'Something went wrong on the server' })
})

module.exports = app
