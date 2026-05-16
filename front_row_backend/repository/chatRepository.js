const { Message } = require('../model/Message')

class ChatRepository {
    constructor() {}

    async addMessage(messageData) {
        return Message.create(messageData)
    }

    async getRecentMessages({ room = 'lobby', limit = 50 } = {}) {
        return Message.find({ room })
            .sort({ createdAt: 1 })
            .limit(limit)
            .lean()
    }
}

module.exports = new ChatRepository()
