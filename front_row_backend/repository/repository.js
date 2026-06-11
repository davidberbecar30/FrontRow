const { Event, EventDate, Purchase, UserTicket, UserFavorite, Ticket, User, sequelize } = require("../model/associations.js")
const { sendTicketConfirmation } = require('../service/emailService')
const {Op,fn,col}=require("sequelize")

const withDates={include:[{association:"dates"}]}

class EventRepository{

    constructor(){}

    async getAllEvents({ page = 1, limit = 4, category, search, location, dateFrom, dateTo, sort, userId } = {}) {
        const where = {}
        if (category) where.category = category
        if (search)   where.title = { [Op.iLike]: `%${search}%` }

        const dateWhere = {}
        if (location) dateWhere.location = { [Op.iLike]: `%${location}%` }
        if (dateFrom && dateTo)  dateWhere.date = { [Op.between]: [dateFrom, dateTo] }
        else if (dateFrom)       dateWhere.date = { [Op.gte]: dateFrom }
        else if (dateTo)         dateWhere.date = { [Op.lte]: dateTo }

        const hasDateFilter = location || dateFrom || dateTo
        const order = sort === 'price_desc' ? [['price', 'DESC']] : [['id', 'ASC']]

        const result = await Event.findAndCountAll({
            where,
            include: [{
                association: 'dates',
                where:    hasDateFilter ? dateWhere : undefined,
                required: !!hasDateFilter
            }],
            limit,
            offset: (page - 1) * limit,
            order,
            distinct: true
        })

        // Enrich with per-user favorited flag when the caller is authenticated
        if (userId && result.rows.length > 0) {
            const eventIds = result.rows.map(e => e.id)
            const favRows  = await UserFavorite.findAll({
                where: { userId, eventId: eventIds },
                attributes: ['eventId']
            })
            const favSet = new Set(favRows.map(f => f.eventId))
            result.rows = result.rows.map(e => {
                const plain = e.get({ plain: true })
                plain.userFavorited = favSet.has(e.id)
                return plain
            })
        }

        return result
    }

    async getEventById(id){
        return Event.findByPk(id, withDates)
    }

    async addEvent(eventDetails){
        const {dates=[], ...eventFields}=eventDetails
        const createdEvent=await Event.create(eventFields)
        if(dates.length>0){
            await EventDate.bulkCreate(dates.map(d=>({ ...d, eventId:createdEvent.id})))
        }
        return Event.findByPk(createdEvent.id, withDates)
    }

    // Generate ticket rows per date. Each date gets its own full set of seats.
    // After creation, syncs EventDate.availableTickets from the ticket rows.
    async _generateTickets(eventId, basePrice, dates) {
        if (!dates || dates.length === 0) return
        const SECTIONS = ['VIP', 'Floor', 'Balcony', 'Standard', 'General Admission']
        const SEATS_PER_SECTION = 10
        const tickets = []
        for (const date of dates) {
            for (const section of SECTIONS) {
                for (let s = 1; s <= SEATS_PER_SECTION; s++) {
                    const row = String.fromCharCode(64 + Math.ceil(s / 2))
                    tickets.push({
                        eventId,
                        eventDateId: date.id,
                        seat: `${row}${s}`,
                        section,
                        status: 'available',
                        price: basePrice
                    })
                }
            }
        }
        await Ticket.bulkCreate(tickets)
        for (const date of dates) {
            await this.syncDateAvailability(date.id)
        }
    }

    // Recount available ticket rows for a date and write to EventDate.availableTickets.
    // Single atomic UPDATE…SET subquery — no separate SELECT needed.
    async syncDateAvailability(dateId) {
        await sequelize.query(
            `UPDATE event_dates
             SET "availableTickets" = (
                 SELECT COUNT(*) FROM tickets
                 WHERE "eventDateId" = :dateId AND status = 'available'
             )
             WHERE id = :dateId`,
            { replacements: { dateId } }
        )
        // Return the value we just wrote
        const ed = await EventDate.findByPk(dateId, { attributes: ['availableTickets'] })
        return ed ? ed.availableTickets : 0
    }

    async updateEvent(id, eventDetails){
        const existingEvent=await Event.findByPk(id)
        if(!existingEvent){
            return null
        }
        const {dates, ...eventFields}=eventDetails
        await existingEvent.update(eventFields)
        if(dates !== undefined){
            await EventDate.destroy({where:{eventId:id}})
            if(dates.length>0){
                await EventDate.bulkCreate(
                    dates.map(d=>({...d,eventId:existingEvent.id}))
                )
            }
        }
        return Event.findByPk(id,withDates)
    }

    async deleteEvent(id){
        const existingEvent=await Event.findByPk(id)
        if(!existingEvent) return null
        await existingEvent.destroy()
        return existingEvent
    }

    // Legacy global toggle — kept for backward compat but no longer used
    async toggleFavorite(id){
        const existingEvent=await Event.findByPk(id)
        if(!existingEvent) return null
        existingEvent.favorited=!existingEvent.favorited
        await existingEvent.save()
        return Event.findByPk(id, withDates)
    }

    // Per-user favorites ─────────────────────────────────────────────────────

    async toggleUserFavorite(userId, eventId) {
        const existing = await UserFavorite.findOne({ where: { userId, eventId } })
        if (existing) {
            await existing.destroy()
            return { favorited: false, eventId }
        }
        await UserFavorite.create({ userId, eventId })
        return { favorited: true, eventId }
    }

    async getUserFavorites(userId) {
        const favRows = await UserFavorite.findAll({
            where: { userId },
            include: [{
                association: 'event',
                include: [{ association: 'dates' }]
            }]
        })
        return favRows
            .map(f => {
                if (!f.event) return null
                const plain = f.event.get({ plain: true })
                plain.userFavorited = true
                return plain
            })
            .filter(Boolean)
    }

    async countEvents(){
        return Event.count()
    }

    async getCategoryBreakdown() {
        const rows = await Event.findAll({
            attributes: ['category', [fn('COUNT', col('id')), 'count']],
            group: ['category'],
            raw: true
        })
        const result = {}
        rows.forEach(r => { result[r.category] = Number(r.count) })
        return result
    }

    async getTrending(limit=6){
        return Event.findAll({
            order:[["price","DESC"]],
            limit,
            include: [{ association: 'dates' }]
        })
    }

    async getTicketsAvailability() {
        return Event.findAll({
            attributes: ['id', 'title', 'availableTickets'],
            raw: true
        })
    }

    async purchaseTickets(eventId, userId, quantity, dateId) {
        const event = await Event.findByPk(eventId)
        if (!event) return null

        const eventDate = await EventDate.findOne({ where: { id: dateId, eventId } })
        if (!eventDate) {
            const err = new Error('Event date not found')
            err.status = 404
            throw err
        }
        if (eventDate.availableTickets < quantity) {
            const err = new Error('Not enough tickets available for this date')
            err.status = 400
            throw err
        }

        // Find actual available ticket rows for this date and mark them sold
        const toSell = await Ticket.findAll({
            where: { eventDateId: dateId, status: 'available' },
            limit: quantity
        })
        if (toSell.length < quantity) {
            const err = new Error('Not enough tickets available for this date')
            err.status = 400
            throw err
        }
        await Ticket.update(
            { status: 'sold' },
            { where: { id: toSell.map(t => t.id) } }
        )

        // Sync the counter from actual ticket rows (single source of truth)
        const newCount = await this.syncDateAvailability(dateId)
        event.availableTickets = Math.max(0, event.availableTickets - quantity)
        await event.save()

        // Generate a unique check-in code for this purchase
        const checkInCode = require('crypto').randomUUID()

        const purchase = await Purchase.create({ userId, eventId, quantity, unitPrice: event.price, checkInCode })
        await UserTicket.create({ userId, purchaseId: purchase.id })

        // Send ticket confirmation email with QR code (non-blocking — don't fail purchase if email fails)
        try {
            const buyer   = await User.findByPk(userId, { attributes: ['firstName', 'lastName', 'email'] })
            const dateObj = await EventDate.findByPk(dateId, { attributes: ['date', 'venue', 'location'] })
            if (buyer) {
                await sendTicketConfirmation({
                    to:         buyer.email,
                    buyerName:  `${buyer.firstName} ${buyer.lastName}`,
                    eventTitle: event.title,
                    eventDate:  dateObj ? new Date(dateObj.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) : null,
                    eventVenue: dateObj ? `${dateObj.venue}, ${dateObj.location}` : null,
                    quantity,
                    unitPrice:  event.price,
                    checkInCode
                })
            }
        } catch (emailErr) {
            console.error('[purchaseTickets] Failed to send confirmation email:', emailErr.message)
        }

        return { purchase, availableTickets: newCount }
    }

    async getMyTickets(userId) {
        return Purchase.findAll({
            where: { userId },
            include: [{
                model: Event,
                as: 'event',
                include: [{ association: 'dates' }]
            }],
            order: [['createdAt', 'DESC']]
        })
    }

}
module.exports=new EventRepository();