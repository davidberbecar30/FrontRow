const express = require('express')
const cors = require('cors')
const { createHandler } = require('graphql-http/lib/use/express')
const routes = require('./router/router')
const schema = require('./graphql/schema')
const resolvers = require('./graphql/resolvers')
const ticketRoutes = require('./router/ticketRoutes')
const authRoutes = require('./router/authRoutes')
const chatRoutes = require('./router/chatRoutes')
const adminRoutes = require('./router/adminRoutes')
const extractUser = require('./middleware/extractUser')
const logAction = require('./middleware/logAction')


const app = express()

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],

}));
app.use(express.json())
app.use('/images', express.static('public/images'))

app.use(extractUser)

app.use(logAction)

app.use('/events', routes)
app.use('/auth', authRoutes)
app.use('/chat', chatRoutes)
app.use('/admin', adminRoutes)

if (process.env.NODE_ENV !== 'test') {
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