const chatRepository = require('../repository/chatRepository')
const { classifyToxicity } = require('./hfService')

// Messages with a toxicity score at or above this threshold are blocked.
const TOXICITY_THRESHOLD = 0.80

class ChatService {
    constructor() {}

    async sendMessage({ from, fromName, text, room = 'lobby' }) {
        if (!from || !fromName || !text || !text.trim()) {
            const err = new Error('Missing required fields: from, fromName, text')
            err.status = 400
            throw err
        }

        // ── AI toxicity gate ─────────────────────────────────────────────────
        // classifyToxicity returns null when HF is unavailable — we allow the
        // message through in that case so chat is never silently broken.
        const toxicity = await classifyToxicity(text.trim())
        if (toxicity?.label === 'toxic' && toxicity.score >= TOXICITY_THRESHOLD) {
            const pct = Math.round(toxicity.score * 100)
            const err = new Error(
                `Message blocked: AI moderation flagged this content (${pct}% confidence).`
            )
            err.status = 400
            throw err
        }
        // ────────────────────────────────────────────────────────────────────

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
