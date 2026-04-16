class Event {
    static nextId=1
    constructor({
        title,
        description,
        category,
        price,
        availableTickets,
        dates,
        image = null,
        favorited = false
    }) {
        this.id =Event.nextId++
        this.title = title
        this.description = description
        this.category = category
        this.price = Number(price)
        this.availableTickets = Number(availableTickets)
        this.dates = dates    // array of { date, location, venue }
        this.image = image
        this.favorited = favorited
    }
}

module.exports = { Event }