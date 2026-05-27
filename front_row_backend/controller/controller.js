const service = require('../service/service')

class EventController {

    async getAllEvents(req, res, next) {
        try {
            const { page, limit, category, search } = req.query
            const result = await service.getEvents({
                page: Number(page),
                limit: Number(limit),
                category,
                search
            })
            return res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    }

    async getEventById(req, res, next) {
        try {
            const id = Number(req.params.id)
            const event = await service.getEventById(id)
            if (!event) {
                return res.status(404).json({ message: `Event with id ${id} not found` })
            }
            return res.status(200).json(event)
        } catch (err) {
            next(err)
        }
    }

    async addEvent(req, res, next) {
        try {
            const eventDetails = req.body
            if (!eventDetails) {
                return res.status(400).json("Body is incorrect")
            }
            const addedEvent = await service.addEvent(eventDetails)
            if (!addedEvent) {
                return res.status(400).json("Event could not be added")
            }
            return res.status(201).json(addedEvent)
        } catch (err) {
            next(err)
        }
    }

    async updateEvent(req, res, next) {
        try {
            const id = Number(req.params.id)
            const eventDetails = req.body
            const existingEvent = await service.getEventById(id)
            if (!existingEvent) {
                return res.status(404).json({ message: `Event with id ${id} wasnt found.` })
            }
            const updated = await service.updateEvent(id, eventDetails)
            if (!updated) {
                return res.status(400).json({ message: "Event could not be updated" })
            }
            return res.status(200).json(updated)
        } catch (err) {
            next(err)
        }
    }

    async deleteEvent(req, res, next) {
        try {
            const id = Number(req.params.id)
            const deleted = await service.deleteEvent(id)
            if (!deleted) {
                return res.status(404).json({ message: "Event wasnt deleted." })
            }
            return res.status(200).json(deleted)
        } catch (err) {
            next(err)
        }
    }

    async toggleFavorite(req, res, next) {
        try {
            const id = Number(req.params.id)
            const favorited = await service.toggleFavorite(id)
            if (!favorited) {
                return res.status(404).json({ message: "Could not toggle for event" })
            }
            return res.status(200).json(favorited)
        } catch (err) {
            next(err)
        }
    }

    async purchaseTickets(req, res, next) {
        try {
            const eventId  = Number(req.params.id)
            const userId   = req.user.id
            const quantity = Number(req.body.quantity)
            if (!quantity || quantity < 1) {
                return res.status(400).json({ error: 'quantity must be at least 1' })
            }
            const result = await service.purchaseTickets(eventId, userId, quantity)
            if (!result) return res.status(404).json({ error: 'Event not found' })
            return res.status(201).json(result)
        } catch (err) {
            next(err)
        }
    }

    async getMyTickets(req, res, next) {
        try {
            const purchases = await service.getMyTickets(req.user.id)
            return res.status(200).json(purchases)
        } catch (err) {
            next(err)
        }
    }

    async getStatistics(req, res, next) {
        try {
            return res.status(200).json(await service.getStatistics())
        } catch (err) {
            next(err)
        }
    }
}

module.exports = new EventController()