const http = require('http')
const app = require('./app')
const { initWebSocket } = require('./websocket/wsServer')

const PORT = 3000

const server = http.createServer(app)
initWebSocket(server)

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`WebSocket running on ws://localhost:${PORT}`)
})