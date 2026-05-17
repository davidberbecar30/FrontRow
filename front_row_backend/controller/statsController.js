const statsService = require('../service/statsService')

class StatsController {

    /**
     * GET /stats/naive
     *
     * Always re-runs the full DB query — no cache, no index hints.
     * This is the "before" baseline you hammer with JMeter to show it
     * crumbling under load (response time climbs, error rate rises).
     */
    async naive(req, res, next) {
        try {
            const result = await statsService.getNaiveStats()
            res.setHeader('X-Query-Ms', result.queryMs)
            return res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    }

    /**
     * GET /stats/optimised
     *
     * Cache-first response.  First request hits the DB (with indices),
     * every subsequent request within the TTL window is served from memory
     * in < 1 ms.  This is the "after" endpoint that stays healthy under
     * the same JMeter load.
     */
    async optimised(req, res, next) {
        try {
            const result = await statsService.getOptimisedStats()
            res.setHeader('X-Query-Ms', result.queryMs)
            res.setHeader('X-Cache-Source', result.source)
            return res.status(200).json(result)
        } catch (err) {
            next(err)
        }
    }

    /**
     * POST /stats/cache/clear
     * Wipes the in-memory cache so the next /stats/optimised call re-queries.
     * Useful during demos and after a bulk seed.
     */
    async clearCache(req, res, next) {
        try {
            statsService.clearCache()
            return res.status(200).json({ message: 'Cache cleared' })
        } catch (err) {
            next(err)
        }
    }
}

module.exports = new StatsController()
