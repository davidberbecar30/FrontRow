const controller = require('../controller/controller')
const express = require('express')
const router  = express.Router()
const { eventValidationRules, validate } = require('../validation/eventValidation')
const { requireAuth } = require('../middleware/authenticate')
const { requireRole, requirePermission } = require('../middleware/authorize')

// ── Public reads ─────────────────────────────────────────────────────────────
router.get('/',            controller.getAllEvents)
router.get('/statistics',  controller.getStatistics)
router.get('/my-tickets',  requireAuth, controller.getMyTickets)
router.get('/my-favorites', requireAuth, controller.getMyFavorites)
router.get('/:id',         controller.getEventById)

// ── Authenticated: favorite toggle ───────────────────────────────────────────
router.patch('/:id/favorite',
    requireAuth, requirePermission('events.favorite'),
    controller.toggleFavorite
)

// ── Authenticated: purchase tickets ─────────────────────────────────────────
router.post('/:id/purchase',
    requireAuth,
    controller.purchaseTickets
)

// ── Authenticated: outfit suggestion ─────────────────────────────────────────
router.post('/:id/outfit',
    requireAuth,
    controller.getOutfit
)
router.patch('/purchases/:purchaseId/outfit',
    requireAuth,
    controller.saveOutfit
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
