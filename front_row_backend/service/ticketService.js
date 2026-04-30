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
        return ticketRepository.add({ ...ticketData, eventId: Number(eventId) })
    }

    async updateTicket(id, ticketData) {
        const ticket = await ticketRepository.getById(id)
        if (!ticket) return null
        return ticketRepository.update(id, ticketData)
    }

    async deleteTicket(id) {
        const ticket = await ticketRepository.getById(id)
        if (!ticket) return null
        return ticketRepository.delete(id)
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
