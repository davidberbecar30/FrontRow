const mongoose = require('mongoose')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/frontrowChat'

async function connectMongo() {
    await mongoose.connect(MONGO_URI)
    console.log('MongoDB connected:', MONGO_URI)
}

module.exports = { mongoose, connectMongo }
