const service = require('../service/service')

const resolvers = {
    events: ({ page, limit, search, category }) => {
        const result = service.getEvents({
            page: page || 1,
            limit: limit || 4,
            search: search || '',
            category: category || ''
        })
        return {
            data: result.data,
            pagination: result.pagination
        }
    },

    event: ({ id }) => {
        return service.getEventById(id)
    },

    statistics: () => {
        const stats = service.getStatistics()
        return {
            ...stats,
            categoryBreakdown: JSON.stringify(stats.categoryBreakdown)
        }
    },

    addEvent: ({ input }) => {
        return service.addEvent(input)
    },

    updateEvent: ({ id, input }) => {
        return service.updateEvent(id, input)
    },

    deleteEvent: ({ id }) => {
        return service.deleteEvent(id)
    },

    toggleFavorite: ({ id }) => {
        return service.toggleFavorite(id)
    }
}

module.exports = resolvers