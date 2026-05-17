const express = require('express')
const router  = express.Router()
const ctrl    = require('../controller/statsController')

// ── Public stats endpoints ───────────────────────────────────────────────────

// Naive: no cache, always hits DB — use this as JMeter "before" target
router.get('/naive',      ctrl.naive.bind(ctrl))

// Optimised: in-memory cache + DB indices — use as JMeter "after" target
router.get('/optimised',  ctrl.optimised.bind(ctrl))

// Cache management
router.post('/cache/clear', ctrl.clearCache.bind(ctrl))

module.exports = router
