const { Purchase, User, Event } = require('../model/associations.js')
const { fn, col, literal } = require('sequelize')

async function getRevenueSummary() {
    const [summary, recent] = await Promise.all([
        Purchase.findOne({
            attributes: [
                [fn('COUNT', col('id')), 'totalPurchases'],
                [fn('SUM', literal('"quantity" * "unitPrice"')), 'totalRevenue']
            ],
            raw: true
        }),
        Purchase.findAll({
            include: [
                { model: User,  as: 'user',  attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: Event, as: 'event', attributes: ['id', 'title', 'category'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: 50
        })
    ])

    return {
        totalPurchases: Number(summary?.totalPurchases || 0),
        totalRevenue:   Number(summary?.totalRevenue   || 0),
        recent: recent.map(p => ({
            id:          p.id,
            user:        p.user,
            event:       p.event,
            quantity:    p.quantity,
            unitPrice:   Number(p.unitPrice),
            total:       (p.quantity * Number(p.unitPrice)).toFixed(2),
            purchasedAt: p.createdAt
        }))
    }
}

module.exports = { getRevenueSummary }
