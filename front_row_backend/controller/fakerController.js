const fakerService  = require('../service/fakerService')
const { runBulkSeed } = require('../seed/bulkSeed')
const statsService  = require('../service/statsService')

class FakerController {

    async start(req, res, next) {
        try {
            const result = await fakerService.startFakerLoop()
            return res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    }

    async stop(req, res, next) {
        try {
            const result = await fakerService.stopFakerLoop()
            return res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    }

    async status(req, res) {
        return res.status(200).json({ running: fakerService.isRunning() })
    }

    /**
     * POST /faker/bulk-seed
     * Body (optional): { events: 1000 }
     *
     * Inserts a large batch of faker data for performance testing.
     * Also clears the stats cache so the next /stats/optimised call
     * reflects the new data.
     */
    async bulkSeed(req, res, next) {
        try {
            const events = Number(req.body?.events) || 1000
            if (events > 10_000) {
                return res.status(400).json({ error: 'Max 10 000 events per seed run' })
            }
            const summary = await runBulkSeed({ events })
            statsService.clearCache()   // stale cache would hide the new data
            return res.status(201).json({ message: 'Bulk seed complete', ...summary })
        } catch (err) {
            next(err)
        }
    }
}

module.exports = new FakerController()
