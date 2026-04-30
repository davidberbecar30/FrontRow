const express = require('express')
const cors = require('cors')
const { createHandler } = require('graphql-http/lib/use/express')
const routes = require('./router/router')
const schema = require('./graphql/schema')
const resolvers = require('./graphql/resolvers')
const ticketRoutes = require('./router/ticketRoutes')


const app = express()

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],

}));
app.use(express.json())
app.use('/images', express.static('public/images'))

app.use('/events', routes)

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
    res.status(500).json({ error: 'Something went wrong on the server' })
})

module.exports = app