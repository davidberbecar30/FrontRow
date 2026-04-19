const { Ticket } = require('../model/Ticket')

class TicketRepository {
    tickets = [
        new Ticket({ eventId: 1, seat: 'A1', section: 'VIP', status: 'available', price: 200 }),
        new Ticket({ eventId: 1, seat: 'A2', section: 'VIP', status: 'sold', price: 200 }),
        new Ticket({ eventId: 1, seat: 'B1', section: 'Standard', status: 'available', price: 135 }),
        new Ticket({ eventId: 2, seat: 'A1', section: 'VIP', status: 'available', price: 150 }),
        new Ticket({ eventId: 2, seat: 'B1', section: 'Standard', status: 'reserved', price: 89 }),
        new Ticket({ eventId: 3, seat: 'C1', section: 'Standard', status: 'available', price: 38 }),
    ]

    getAllByEventId(eventId) {
        return this.tickets.filter(t => t.eventId === Number(eventId))
    }

    getById(id) {
        return this.tickets.find(t => t.id === Number(id))
    }

    add(ticketData) {
        const ticket = new Ticket(ticketData)
        this.tickets.push(ticket)
        return ticket
    }

    update(id, ticketData) {
        const index = this.tickets.findIndex(t => t.id === Number(id))
        if (index === -1) return null
        this.tickets[index] = { ...this.tickets[index], ...ticketData }
        return this.tickets[index]
    }

    delete(id) {
        const index = this.tickets.findIndex(t => t.id === Number(id))
        if (index === -1) return null
        const removed = this.tickets[index]
        this.tickets.splice(index, 1)
        return removed
    }

    getStatsByEventId(eventId) {
        const tickets = this.getAllByEventId(eventId)
        const total = tickets.length
        const available = tickets.filter(t => t.status === 'available').length
        const sold = tickets.filter(t => t.status === 'sold').length
        const reserved = tickets.filter(t => t.status === 'reserved').length
        const revenue = tickets
            .filter(t => t.status === 'sold')
            .reduce((sum, t) => sum + (t.price || 0), 0)

        return { total, available, sold, reserved, revenue }
    }
}

module.exports = new TicketRepository()