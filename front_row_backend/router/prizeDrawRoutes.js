const express    = require('express')
const router     = express.Router()
const ctrl       = require('../controller/prizeDrawController')
const { requireAuth, optionalAuth } = require('../middleware/authenticate')
const { requireRole }               = require('../middleware/authorize')

// Public (but enriched with userOptedIn when logged in)
router.get('/active',    optionalAuth, ctrl.getActiveDraw)

// Authenticated
router.get('/my-result', requireAuth, ctrl.getMyResult)
router.post('/:id/enter', requireAuth, ctrl.enterDraw)

// Admin only
router.post('/',   requireAuth, requireRole('admin'), ctrl.startDraw)
router.get('/',    requireAuth, requireRole('admin'), ctrl.listDraws)

module.exports = router
