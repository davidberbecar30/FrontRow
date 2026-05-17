const express = require('express')
const router  = express.Router()
const ctrl    = require('../controller/fakerController')
const { simulate } = require('../controller/simulatorController')

router.post('/start',     ctrl.start.bind(ctrl))
router.post('/stop',      ctrl.stop.bind(ctrl))
router.get('/status',     ctrl.status.bind(ctrl))
router.post('/bulk-seed', ctrl.bulkSeed.bind(ctrl))   // fills DB for performance testing
router.post('/simulate',  simulate)                    // runs suspicious-behaviour scenarios

module.exports = router
