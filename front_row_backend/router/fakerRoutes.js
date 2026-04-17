const express = require('express')
const router = express.Router()
const fakerController = require('../controller/fakerController')

router.post('/start', fakerController.start)
router.post('/stop', fakerController.stop)
router.get('/status', fakerController.status)

module.exports = router