require('dotenv').config({
    path: process.env.NODE_ENV === 'test' ? '.env.tests' : '.env'
})
const { Sequelize } = require('sequelize')

// Support a single DATABASE_URL (Render) or individual vars (local dev)
const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
        logging: process.env.NODE_ENV === 'test' ? false : console.log
    })
    : new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD || null,
        {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            dialect: 'postgres',
            logging: process.env.NODE_ENV === 'test' ? false : console.log
        }
    )

module.exports = sequelize