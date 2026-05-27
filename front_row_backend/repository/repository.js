const { Event, EventDate, Purchase } = require("../model/associations.js")
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
        if(dates.length>0){
            await EventDate.bulkCreate(
                dates.map(d=>({ ...d, eventId:createdEvent.id}))
            )
        }
        return Event.findByPk(createdEvent.id, withDates)
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

    async purchaseTickets(eventId, userId, quantity) {
        const event = await Event.findByPk(eventId)
        if (!event) return null
        if (event.availableTickets < quantity) {
            const err = new Error('Not enough tickets available')
            err.status = 400
            throw err
        }
        event.availableTickets -= quantity
        await event.save()
        const purchase = await Purchase.create({
            userId,
            eventId,
            quantity,
            unitPrice: event.price
        })
        return { purchase, availableTickets: event.availableTickets }
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