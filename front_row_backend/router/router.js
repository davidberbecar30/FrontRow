const controller = require('../controller/controller')
const express = require('express')
const router = express.Router()
const { eventValidationRules, validate } = require('../validation/eventValidation')
const { requireAuth } = require('../middleware/authenticate')
const { requireRole } = require('../middleware/authorize')

// Public reads
router.get('/',              controller.getAllEvents)
router.get('/statistics',    controller.getStatistics)
router.get('/:id',           controller.getEventById)

// Authenticated favorite toggle
router.patch('/:id/favorite', requireAuth, controller.toggleFavorite)

// Admin-only writes
router.post('/',
    requireAuth, requireRole('admin'),
    eventValidationRules, validate,
    controller.addEvent
)
router.put('/:id',
    requireAuth, requireRole('admin'),
    eventValidationRules, validate,
    controller.updateEvent
)
router.delete('/:id',
    requireAuth, requireRole('admin'),
    controller.deleteEvent
)

module.exports = router
