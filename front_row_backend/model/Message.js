const { mongoose } = require('../mongoDb')
const { Schema } = mongoose

const messageSchema = new Schema(
    {
        from:     { type: Number, required: true }, //id from postgres
        fromName: { type: String, required: true },
        text:     { type: String, required: true, trim: true, maxlength: 1000 },
        room:     { type: String, required: true, default: 'lobby' }
    },
    { timestamps: true }
)

const Message = mongoose.model('Message', messageSchema)

module.exports = { Message }
