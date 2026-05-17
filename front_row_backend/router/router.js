const controller = require('../controller/controller')
const express = require('express')
const router  = express.Router()
const { eventValidationRules, validate } = require('../validation/eventValidation')
const { requireAuth } = require('../middleware/authenticate')
const { requireRole, requirePermission } = require('../middleware/authorize')

// ── Public reads ─────────────────────────────────────────────────────────────
router.get('/',           controller.getAllEvents)
router.get('/statistics', controller.getStatistics)
router.get('/:id',        controller.getEventById)

// ── Authenticated: favorite toggle ───────────────────────────────────────────
// Any logged-in user with the events.favorite permission (user + above)
router.patch('/:id/favorite',
    requireAuth, requirePermission('events.favorite'),
    controller.toggleFavorite
)

// ── Admin / Moderator writes ──────────────────────────────────────────────────
router.post('/',
    requireAuth, requirePermission('events.create'),
    eventValidationRules, validate,
    controller.addEvent
)
router.put('/:id',
    requireAuth, requirePermission('events.update'),
    eventValidationRules, validate,
    controller.updateEvent
)

// ── Admin-only destructive actions ───────────────────────────────────────────
router.delete('/:id',
    requireAuth, requireRole('admin'),
    controller.deleteEvent
)

module.exports = router
