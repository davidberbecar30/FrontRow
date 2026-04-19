class Ticket {
    static nextId = 1

    constructor({
        eventId,
        seat,
        section,
        status = 'available',
        price = null
    }) {
        this.id = Ticket.nextId++
        this.eventId = Number(eventId)
        this.seat = seat
        this.section = section
        this.status = status  // available, sold, reserved
        this.price = price ? Number(price) : null
    }
}

module.exports = { Ticket }