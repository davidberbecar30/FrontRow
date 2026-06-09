const service      = require('../service/service')
const outfitService = require('../service/outfitService')
const { Purchase }  = require('../model/associations')

class EventController {

    async getAllEvents(req, res, next) {
        try {
            const { page, limit, category, search, location, dateFrom, dateTo, sort } = req.query
            const result = await service.getEvents({
                page: Number(page),
                limit: Number(limit),
                category,
                search,
                location,
                dateFrom,
                dateTo,
                sort
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
            const dateId   = Number(req.body.dateId)
            if (!quantity || quantity < 1) {
                return res.status(400).json({ error: 'quantity must be at least 1' })
            }
            if (!dateId) {
                return res.status(400).json({ error: 'dateId is required' })
            }
            const result = await service.purchaseTickets(eventId, userId, quantity, dateId)
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

    // POST /events/:id/outfit  — generate outfit suggestion for an event
    async getOutfit(req, res, next) {
        try {
            const event = await service.getEventById(Number(req.params.id))
            if (!event) return res.status(404).json({ error: 'Event not found' })

            const gender = req.body.gender === 'female' ? 'female' : 'male'
            const outfit = outfitService.suggestOutfit(event.category, gender)
            return res.status(200).json({ outfit, category: event.category, gender })
        } catch (err) {
            next(err)
        }
    }

    // PATCH /purchases/:purchaseId/outfit  — save outfit to a purchase record
    async saveOutfit(req, res, next) {
        try {
            const purchase = await Purchase.findOne({
                where: { id: Number(req.params.purchaseId), userId: req.user.id }
            })
            if (!purchase) return res.status(404).json({ error: 'Purchase not found' })

            purchase.outfitSuggestion = req.body.outfit
            await purchase.save()
            return res.status(200).json({ saved: true })
        } catch (err) {
            next(err)
        }
    }
}

module.exports = new EventController()