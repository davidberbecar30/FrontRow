const ticketRepository = require('../repository/ticketRespository')
const repository       = require('../repository/repository')

class TicketService {

    async getTicketsByEventId(eventId) {
        const event = await repository.getEventById(eventId)
        if (!event) return null
        return ticketRepository.getAllByEventId(eventId)
    }

    async getTicketById(id) {
        return ticketRepository.getById(id)
    }

    async addTicket(eventId, ticketData) {
        const event = await repository.getEventById(eventId)
        if (!event) return null
        const ticket = await ticketRepository.add({ ...ticketData, eventId: Number(eventId) })
        // Sync the date's available count if this ticket belongs to a date
        if (ticket.eventDateId) {
            await repository.syncDateAvailability(ticket.eventDateId)
        }
        return ticket
    }

    async updateTicket(id, ticketData) {
        const ticket = await ticketRepository.getById(id)
        if (!ticket) return null
        const updated = await ticketRepository.update(id, ticketData)
        // Status or date changed — resync both the old and new date
        const dateId = updated.eventDateId || ticket.eventDateId
        if (dateId) await repository.syncDateAvailability(dateId)
        if (ticketData.eventDateId && ticketData.eventDateId !== ticket.eventDateId) {
            await repository.syncDateAvailability(ticket.eventDateId)
        }
        return updated
    }

    async deleteTicket(id) {
        const ticket = await ticketRepository.getById(id)
        if (!ticket) return null
        const deleted = await ticketRepository.delete(id)
        if (ticket.eventDateId) {
            await repository.syncDateAvailability(ticket.eventDateId)
        }
        return deleted
    }

    async getStatsByEventId(eventId) {
        const event = await repository.getEventById(eventId)
        if (!event) return null
        return ticketRepository.getStatsByEventId(eventId)
    }

    async getGlobalStats() {
        return ticketRepository.getGlobalStats()
    }
}

module.exports = new TicketService()
