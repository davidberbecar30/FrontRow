const observationRepository = require('../repository/observationRepository')
const logRepository = require('../repository/logRepository')
const revenueRepository = require('../repository/revenueRepository')
const { Purchase, Event, User, EventDate } = require('../model/associations')

class AdminController {

    async getObservations(req, res, next) {
        try {
            // Authorization is handled by requirePermission('admin.observations') middleware
            const observations = await observationRepository.findAll()
            return res.status(200).json(observations)
        } catch (err) {
            next(err)
        }
    }

    async getLogs(req, res, next) {
        try {
            // Authorization is handled by requirePermission('admin.logs') middleware
            const limit = Number(req.query.limit) || 100
            const logs = await logRepository.findRecent(limit)
            return res.status(200).json(logs)
        } catch (err) {
            next(err)
        }
    }

    async clearObservation(req, res, next) {
        try {
            // Authorization is handled by requireRole('admin') middleware
            const removed = await observationRepository.deleteById(req.params.id)
            if (!removed) return res.status(404).json({ error: 'Observation not found' })
            return res.status(200).json(removed)
        } catch (err) {
            next(err)
        }
    }

    async getRevenue(req, res, next) {
        try {
            const data = await revenueRepository.getRevenueSummary()
            return res.status(200).json(data)
        } catch (err) {
            next(err)
        }
    }

    // POST /admin/check-in  { code: "<checkInCode>" }
    async checkIn(req, res, next) {
        try {
            const { code } = req.body
            if (!code) return res.status(400).json({ error: 'code is required' })

            const purchase = await Purchase.findOne({
                where: { checkInCode: code },
                include: [
                    { model: Event, as: 'event', attributes: ['id', 'title', 'category'] },
                    { model: User,  as: 'user',  attributes: ['id', 'firstName', 'lastName', 'email'] }
                ]
            })

            if (!purchase) {
                return res.status(404).json({ valid: false, error: 'Invalid QR code — ticket not found' })
            }

            if (purchase.checkedIn) {
                return res.status(200).json({
                    valid: false,
                    alreadyUsed: true,
                    checkedInAt: purchase.checkedInAt,
                    purchase: {
                        id:         purchase.id,
                        event:      purchase.event,
                        buyer:      purchase.user,
                        quantity:   purchase.quantity,
                        unitPrice:  purchase.unitPrice
                    }
                })
            }

            // Mark as checked in
            purchase.checkedIn   = true
            purchase.checkedInAt = new Date()
            await purchase.save()

            return res.status(200).json({
                valid: true,
                checkedInAt: purchase.checkedInAt,
                purchase: {
                    id:         purchase.id,
                    event:      purchase.event,
                    buyer:      purchase.user,
                    quantity:   purchase.quantity,
                    unitPrice:  purchase.unitPrice
                }
            })
        } catch (err) {
            next(err)
        }
    }
}

module.exports = new AdminController()
