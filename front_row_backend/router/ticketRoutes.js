const express = require('express')
const router = express.Router({ mergeParams: true })
const ticketController = require('../controller/ticketController')

// routes under /events/:eventId/tickets
router.get('/', ticketController.getTicketsByEventId)
router.post('/', ticketController.addTicket)
router.get('/stats', ticketController.getStatsByEventId)

// routes under /tickets
router.get('/global-stats', ticketController.getGlobalStats)
router.get('/:id', ticketController.getTicketById)
router.put('/:id', ticketController.updateTicket)
router.delete('/:id', ticketController.deleteTicket)

module.exports = router