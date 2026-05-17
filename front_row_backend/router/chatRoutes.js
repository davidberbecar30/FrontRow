const express = require('express')
const router = express.Router()
const chatController = require('../controller/chatController')
const { requireAuth } = require('../middleware/authenticate')

// Chat requires being logged in (any role)
router.get('/',  requireAuth, chatController.getMessages)
router.post('/', requireAuth, chatController.sendMessage)

module.exports = router
