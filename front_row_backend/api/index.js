// Vercel serverless entry point.
// Vercel runs this file instead of server.js, so we need to handle
// the DB connections that server.js would normally set up on boot.

const app = require('../app')
const { connectMongo } = require('../mongoDb')

// Connect to MongoDB once per cold start.
// Mongoose caches the connection internally, so warm invocations skip this.
connectMongo().catch(err => console.error('MongoDB connection error:', err))

module.exports = app
