const { WebSocketServer } = require("ws")


let wss=null

function initWebSocket(server) {
    wss = new WebSocketServer({ server })

    wss.on('connection', (ws) => {
        console.log('Client connected via WebSocket')

        ws.on('close', () => {
            console.log('Client disconnected')
        })
    })

    console.log('WebSocket server initialized')
}

function broadcast(message) {
    if (!wss) return
    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(JSON.stringify(message))
        }
    })
}

module.exports = { initWebSocket, broadcast }