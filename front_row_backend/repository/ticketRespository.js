const { Ticket } = require('../model/associations.js')
const { fn, col } = require('sequelize')

class TicketRepository {

    constructor(){}

    async getAllByEventId(eventId) {
        return Ticket.findAll({
            where:{eventId:Number(eventId)},
            order:[["id","ASC"]]
        })
    }

    async getById(id) {
        return Ticket.findByPk(id)
    }

    async add(ticketData) {
        return Ticket.create(ticketData)
    }

    async update(id, ticketData) {
        const existingTicket=await Ticket.findByPk(id)
        if(!existingTicket){
            return null
        }
        await existingTicket.update(ticketData)
        return existingTicket
    }

    async delete(id) {
        const deletedTicket = await Ticket.findByPk(id)
        if (!deletedTicket) return null
        await deletedTicket.destroy()
        return deletedTicket
    }

    async getStatsByEventId(eventId) {
        const id = Number(eventId)

        const [statusRows, revenueRow] = await Promise.all([
            Ticket.findAll({
                where: { eventId: id },
                attributes: ['status', [fn('COUNT', col('id')), 'count']],
                group: ['status'],
                raw: true
            }),
            Ticket.findOne({
                where: { eventId: id, status: 'sold' },
                attributes: [[fn('SUM', col('price')), 'revenue']],
                raw: true
            })
        ])

        const counts = { available: 0, sold: 0, reserved: 0 }
        let total = 0
        statusRows.forEach(r => {
            counts[r.status] = Number(r.count)
            total += Number(r.count)
        })

        const revenue = Number(revenueRow?.revenue || 0)

        return {
            total,
            available: counts.available,
            sold:      counts.sold,
            reserved:  counts.reserved,
            revenue
        }
    }

    async getGlobalStats() {
        const [totalTickets, totalSold, revenueRow, popularRow] = await Promise.all([
            Ticket.count(),
            Ticket.count({ where: { status: 'sold' } }),
            Ticket.findOne({
                where: { status: 'sold' },
                attributes: [[fn('SUM', col('price')), 'revenue']],
                raw: true
            }),
            Ticket.findOne({
                where: { status: 'sold' },
                attributes: ['eventId', [fn('COUNT', col('id')), 'count']],
                group: ['eventId'],
                order: [[fn('COUNT', col('id')), 'DESC']],
                limit: 1,
                raw: true
            })
        ])

        return {
            totalTickets,
            totalSold,
            totalRevenue: Number(revenueRow?.revenue || 0),
            mostPopularEventId: popularRow?.eventId ?? null
        }
    }
}

module.exports = new TicketRepository()