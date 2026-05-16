const chatRepository = require('../repository/chatRepository')

class ChatService {
    constructor() {}

    async sendMessage({ from, fromName, text, room = 'lobby' }) {
        if (!from || !fromName || !text || !text.trim()) {
            const err = new Error('Missing required fields: from, fromName, text')
            err.status = 400
            throw err
        }
        return chatRepository.addMessage({
            from,
            fromName,
            text: text.trim(),
            room
        })
    }

    async getRecentMessages(room = 'lobby', limit = 50) {
        return chatRepository.getRecentMessages({ room, limit })
    }
}

module.exports = new ChatService()
