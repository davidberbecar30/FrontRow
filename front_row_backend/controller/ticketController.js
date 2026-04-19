const ticketService = require('../service/ticketService')

class TicketController {
    getTicketsByEventId(req, res) {
        const { eventId } = req.params
        const tickets = ticketService.getTicketsByEventId(eventId)
        if (!tickets) {
            return res.status(404).json({ message: `Event with id ${eventId} not found` })
        }
        return res.status(200).json(tickets)
    }

    getTicketById(req, res) {
        const { id } = req.params
        const ticket = ticketService.getTicketById(id)
        if (!ticket) {
            return res.status(404).json({ message: `Ticket with id ${id} not found` })
        }
        return res.status(200).json(ticket)
    }

    addTicket(req, res) {
        const { eventId } = req.params
        const ticketData = req.body
        if (!ticketData) {
            return res.status(400).json({ error: 'Request body is missing' })
        }
        const ticket = ticketService.addTicket(eventId, ticketData)
        if (!ticket) {
            return res.status(404).json({ message: `Event with id ${eventId} not found` })
        }
        return res.status(201).json(ticket)
    }

    updateTicket(req, res) {
        const { id } = req.params
        const ticketData = req.body
        const updated = ticketService.updateTicket(id, ticketData)
        if (!updated) {
            return res.status(404).json({ message: `Ticket with id ${id} not found` })
        }
        return res.status(200).json(updated)
    }

    deleteTicket(req, res) {
        const { id } = req.params
        const deleted = ticketService.deleteTicket(id)
        if (!deleted) {
            return res.status(404).json({ message: `Ticket with id ${id} not found` })
        }
        return res.status(200).json(deleted)
    }

    getStatsByEventId(req, res) {
        const { eventId } = req.params
        const stats = ticketService.getStatsByEventId(eventId)
        if (!stats) {
            return res.status(404).json({ message: `Event with id ${eventId} not found` })
        }
        return res.status(200).json(stats)
    }

    getGlobalStats(req, res) {
        return res.status(200).json(ticketService.getGlobalStats())
    }
}

module.exports = new TicketController()