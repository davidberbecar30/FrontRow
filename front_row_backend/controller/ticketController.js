const ticketService = require('../service/ticketService')

class TicketController {

    async getTicketsByEventId(req, res, next) {
        try {
            const { eventId } = req.params
            const tickets = await ticketService.getTicketsByEventId(eventId)
            if (!tickets) {
                return res.status(404).json({ message: `Event with id ${eventId} not found` })
            }
            return res.status(200).json(tickets)
        } catch (err) {
            next(err)
        }
    }

    async getTicketById(req, res, next) {
        try {
            const { id } = req.params
            const ticket = await ticketService.getTicketById(id)
            if (!ticket) {
                return res.status(404).json({ message: `Ticket with id ${id} not found` })
            }
            return res.status(200).json(ticket)
        } catch (err) {
            next(err)
        }
    }

    async addTicket(req, res, next) {
        try {
            const { eventId } = req.params
            const ticketData = req.body
            if (!ticketData) {
                return res.status(400).json({ error: 'Request body is missing' })
            }
            const ticket = await ticketService.addTicket(eventId, ticketData)
            if (!ticket) {
                return res.status(404).json({ message: `Event with id ${eventId} not found` })
            }
            return res.status(201).json(ticket)
        } catch (err) {
            next(err)
        }
    }

    async updateTicket(req, res, next) {
        try {
            const { id } = req.params
            const ticketData = req.body
            const updated = await ticketService.updateTicket(id, ticketData)
            if (!updated) {
                return res.status(404).json({ message: `Ticket with id ${id} not found` })
            }
            return res.status(200).json(updated)
        } catch (err) {
            next(err)
        }
    }

    async deleteTicket(req, res, next) {
        try {
            const { id } = req.params
            const deleted = await ticketService.deleteTicket(id)
            if (!deleted) {
                return res.status(404).json({ message: `Ticket with id ${id} not found` })
            }
            return res.status(200).json(deleted)
        } catch (err) {
            next(err)
        }
    }

    async getStatsByEventId(req, res, next) {
        try {
            const { eventId } = req.params
            const stats = await ticketService.getStatsByEventId(eventId)
            if (!stats) {
                return res.status(404).json({ message: `Event with id ${eventId} not found` })
            }
            return res.status(200).json(stats)
        } catch (err) {
            next(err)
        }
    }

    async getGlobalStats(req, res, next) {
        try {
            return res.status(200).json(await ticketService.getGlobalStats())
        } catch (err) {
            next(err)
        }
    }
}

module.exports = new TicketController()