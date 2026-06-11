const repository = require('../repository/repository')

class EventService {

    async getEvents({ page = 1, limit = 4, category, search, location, dateFrom, dateTo, sort, userId } = {}) {
    const pageNum  = Number(page) || 1
    const limitNum = Number(limit) || 4

    const { rows, count } = await repository.getAllEvents({
        page: pageNum,
        limit: limitNum,
        category,
        search,
        location,
        dateFrom,
        dateTo,
        sort,
        userId
    })

    return {
        data: rows,
        pagination: {
            total: count,
            totalPages: Math.ceil(count / limitNum),
            currentPage: pageNum,
            limit: limitNum
        }
    }
}

    async addEvent(eventDetails) {
        return repository.addEvent(eventDetails)
    }

    async deleteEvent(id) {
        return repository.deleteEvent(id)
    }

    async updateEvent(id, eventDetails) {
        return repository.updateEvent(id, eventDetails)
    }

    async getEventById(id) {
        return repository.getEventById(id)
    }

    async toggleFavorite(id) {
        return repository.toggleFavorite(id)
    }

    async toggleUserFavorite(userId, eventId) {
        return repository.toggleUserFavorite(userId, eventId)
    }

    async getUserFavorites(userId) {
        return repository.getUserFavorites(userId)
    }

    async purchaseTickets(eventId, userId, quantity, dateId) {
        return repository.purchaseTickets(eventId, userId, quantity, dateId)
    }

    async getMyTickets(userId) {
        return repository.getMyTickets(userId)
    }

    async getStatistics() {
        const [totalEvents, categoryBreakdown, trending, ticketsAvailability] =
            await Promise.all([
                repository.countEvents(),
                repository.getCategoryBreakdown(),
                repository.getTrending(6),
                repository.getTicketsAvailability()
            ])

        return { totalEvents, categoryBreakdown, trending, ticketsAvailability }
    }
}

module.exports = new EventService()
