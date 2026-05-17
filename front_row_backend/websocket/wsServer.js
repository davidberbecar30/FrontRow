const { WebSocketServer } = require('ws')
const chatService = require('../service/chatService')

let wss = null

function initWebSocket(server) {
    wss = new WebSocketServer({ server })

    wss.on('connection', (ws) => {
        console.log('Client connected via WebSocket')

        ws.on('message', async (raw) => {
            let data
            try {
                data = JSON.parse(raw.toString())
            } catch {
                return  // ignore non-JSON garbage
            }

            // Chat message from a client → persist + broadcast
            if (data.type === 'CHAT_MESSAGE') {
                try {
                    const saved = await chatService.sendMessage({
                        from:     data.from,
                        fromName: data.fromName,
                        text:     data.text,
                        room:     data.room || 'lobby'
                    })
                    broadcast({ type: 'CHAT_MESSAGE', message: saved })
                } catch (err) {
                    // Send error back to the sender only
                    ws.send(JSON.stringify({
                        type: 'CHAT_ERROR',
                        error: err.message || 'Failed to send message'
                    }))
                }
            }
        })

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
