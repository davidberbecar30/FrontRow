const http = require('http')
const app = require('./app')
console.log('1. requires loaded')

const { sequelize } = require('./model/associations.js')
console.log('2. associations loaded')

const { initWebSocket } = require('./websocket/wsServer')

const PORT = 3000
const HOST='0.0.0.0'

const server = http.createServer(app)
initWebSocket(server)

async function start() {
    try {
        console.log('3. about to authenticate')
        await sequelize.authenticate()
        console.log('4. authenticated')

        await sequelize.sync({ force: false })
        console.log('5. synced')

        server.listen(PORT,HOST, () => {
            console.log(`Server running on http://localhost:${PORT}`)
        })
    } catch (err) {
        console.error('ERROR:', err)
        process.exit(1)
    }
}

start()