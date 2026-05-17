const express = require('express')
const router  = express.Router({ mergeParams: true })
const ticketController = require('../controller/ticketController')
const { requireAuth } = require('../middleware/authenticate')
const { requireRole, requirePermission } = require('../middleware/authorize')

// ── Public reads ─────────────────────────────────────────────────────────────
router.get('/',             ticketController.getTicketsByEventId)
router.get('/stats',        ticketController.getStatsByEventId)
router.get('/global-stats', ticketController.getGlobalStats)
router.get('/:id',          ticketController.getTicketById)

// ── Admin / Moderator writes ──────────────────────────────────────────────────
router.post('/',
    requireAuth, requirePermission('tickets.create'),
    ticketController.addTicket
)
router.put('/:id',
    requireAuth, requirePermission('tickets.update'),
    ticketController.updateTicket
)

// ── Admin-only destructive ────────────────────────────────────────────────────
router.delete('/:id',
    requireAuth, requireRole('admin'),
    ticketController.deleteTicket
)

module.exports = router
