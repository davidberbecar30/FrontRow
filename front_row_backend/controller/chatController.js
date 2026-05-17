const chatService = require('../service/chatService')

class ChatController {

    async getMessages(req, res, next) {
        try {
            const { room = 'lobby', limit = 50 } = req.query
            const messages = await chatService.getRecentMessages(room, Number(limit))
            return res.status(200).json(messages)
        } catch (err) {
            next(err)
        }
    }

    async sendMessage(req, res, next) {
        try {
            const { from, fromName, text, room } = req.body
            const saved = await chatService.sendMessage({ from, fromName, text, room })
            return res.status(201).json(saved)
        } catch (err) {
            next(err)
        }
    }
}

module.exports = new ChatController()
