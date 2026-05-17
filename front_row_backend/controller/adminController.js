const observationRepository = require('../repository/observationRepository')
const logRepository = require('../repository/logRepository')

class AdminController {

    async getObservations(req, res, next) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Admin access required' })
            }
            const observations = await observationRepository.findAll()
            return res.status(200).json(observations)
        } catch (err) {
            next(err)
        }
    }

    async getLogs(req, res, next) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Admin access required' })
            }
            const limit = Number(req.query.limit) || 100
            const logs = await logRepository.findRecent(limit)
            return res.status(200).json(logs)
        } catch (err) {
            next(err)
        }
    }

    async clearObservation(req, res, next) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Admin access required' })
            }
            const removed = await observationRepository.deleteById(req.params.id)
            if (!removed) return res.status(404).json({ error: 'Observation not found' })
            return res.status(200).json(removed)
        } catch (err) {
            next(err)
        }
    }
}

module.exports = new AdminController()
