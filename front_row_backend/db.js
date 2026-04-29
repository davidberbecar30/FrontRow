require('dotenv').config()
const {Sequelize}= require('sequelize')


//new Sequelize(database, username, password, options)
const sequelize= new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD || null,
    {
        host:process.env.DB_HOST,
        port:process.env.DB_PORT,
        dialect: "postgres",
        logging:console.log()
    }
)

module.exports=sequelize