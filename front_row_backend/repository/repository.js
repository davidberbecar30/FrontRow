const { Event, EventDate, Purchase, UserTicket, Ticket, sequelize } = require("../model/associations.js")
const {Op,fn,col}=require("sequelize")

const withDates={include:[{association:"dates"}]}

class EventRepository{

    constructor(){}

    async getAllEvents({ page = 1, limit = 4, category, search, location, dateFrom, dateTo } = {}) {
        const where = {}
        if (category) where.category = category
        if (search)   where.title = { [Op.iLike]: `%${search}%` }

        const dateWhere = {}
        if (location) dateWhere.location = { [Op.iLike]: `%${location}%` }
        if (dateFrom && dateTo)  dateWhere.date = { [Op.between]: [dateFrom, dateTo] }
        else if (dateFrom)       dateWhere.date = { [Op.gte]: dateFrom }
        else if (dateTo)         dateWhere.date = { [Op.lte]: dateTo }

        const hasDateFilter = location || dateFrom || dateTo

        return Event.findAndCountAll({
            where,
            include: [{
                association: 'dates',
                where:    hasDateFilter ? dateWhere : undefined,
                required: !!hasDateFilter
            }],
            limit,
            offset: (page - 1) * limit,
            order:  [['id', 'ASC']],
            distinct: true
        })
    }

    async getEventById(id){
        return Event.findByPk(id, withDates)
    }

    async addEvent(eventDetails){
        const {dates=[], ...eventFields}=eventDetails
        const createdEvent=await Event.create(eventFields)
        let createdDates = []
        if(dates.length>0){
            await EventDate.bulkCreate(dates.map(d=>({ ...d, eventId:createdEvent.id})))
            createdDates = await EventDate.findAll({ where: { eventId: createdEvent.id } })
        }
        await this._generateTickets(createdEvent.id, Number(createdEvent.price), createdDates)
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

    async toggleFavorite(id){
        const existingEvent=await Event.findByPk(id)
        if(!existingEvent) return null
        existingEvent.favorited=!existingEvent.favorited
        await existingEvent.save()
        return Event.findByPk(id, withDates)
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

        const purchase = await Purchase.create({ userId, eventId, quantity, unitPrice: event.price })
        await UserTicket.create({ userId, purchaseId: purchase.id })
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