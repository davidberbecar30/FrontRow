const ticketRepository = require('../repository/ticketRespository')
const repository = require('../repository/repository')

class TicketService {
    getTicketsByEventId(eventId) {
        const event = repository.getEventById(eventId)
        if (!event) return null
        return ticketRepository.getAllByEventId(eventId)
    }

    getTicketById(id) {
        return ticketRepository.getById(id)
    }

    addTicket(eventId, ticketData) {
        const event = repository.getEventById(eventId)
        if (!event) return null
        return ticketRepository.add({ ...ticketData, eventId })
    }

    updateTicket(id, ticketData) {
        const ticket = ticketRepository.getById(id)
        if (!ticket) return null
        return ticketRepository.update(id, ticketData)
    }

    deleteTicket(id) {
        const ticket = ticketRepository.getById(id)
        if (!ticket) return null
        return ticketRepository.delete(id)
    }

    getStatsByEventId(eventId) {
        const event = repository.getEventById(eventId)
        if (!event) return null
        return ticketRepository.getStatsByEventId(eventId)
    }

    getGlobalStats() {
        const allTickets = ticketRepository.tickets
        const totalTickets = allTickets.length
        const totalSold = allTickets.filter(t => t.status === 'sold').length
        const totalRevenue = allTickets
            .filter(t => t.status === 'sold')
            .reduce((sum, t) => sum + (t.price || 0), 0)
        const mostPopularEventId = Object.entries(
            allTickets.reduce((acc, t) => {
                acc[t.eventId] = (acc[t.eventId] || 0) + 1
                return acc
            }, {})
        ).sort((a, b) => b[1] - a[1])[0]?.[0]

        return {
            totalTickets,
            totalSold,
            totalRevenue,
            mostPopularEventId: Number(mostPopularEventId)
        }
    }
}

module.exports = new TicketService()