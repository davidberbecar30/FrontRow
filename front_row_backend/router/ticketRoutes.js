const express = require('express')
const router = express.Router({ mergeParams: true })
const ticketController = require('../controller/ticketController')
const { requireAuth } = require('../middleware/authenticate')
const { requireRole } = require('../middleware/authorize')

// Public reads
router.get('/',               ticketController.getTicketsByEventId)
router.get('/stats',          ticketController.getStatsByEventId)
router.get('/global-stats',   ticketController.getGlobalStats)
router.get('/:id',            ticketController.getTicketById)

// Admin-only writes
router.post('/',
    requireAuth, requireRole('admin'),
    ticketController.addTicket
)
router.put('/:id',
    requireAuth, requireRole('admin'),
    ticketController.updateTicket
)
router.delete('/:id',
    requireAuth, requireRole('admin'),
    ticketController.deleteTicket
)

module.exports = router
