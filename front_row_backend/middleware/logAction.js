const { Op } = require('sequelize')
const { Log, ObservationList } = require('../model/associations')
const { runDetectors } = require('../service/detectorService')
const { generateBehaviorNarrative } = require('../service/hfService')

const RECENT_LOG_WINDOW_MS = 60_000

async function logAction(req, res, next) {
    if (!req.user) return next()
    if (req.path.startsWith('/admin')) return next()

    try {
        
        const entry = await Log.create({
            userId:   req.user.id,
            roleName: req.user.role,
            method:   req.method,
            path:     req.path,
            action:   `${req.method} ${req.path}`
        })

        const recentLogs = await Log.findAll({
            where: {
                userId: req.user.id,
                createdAt: { [Op.gt]: new Date(Date.now() - RECENT_LOG_WINDOW_MS) }
            },
            attributes: ['id', 'method', 'path', 'createdAt']
        })

        const reasons = runDetectors(req, recentLogs)

        
        for (const reason of reasons) {
            const alreadyFlagged = await ObservationList.findOne({
                where: {
                    userId: req.user.id,
                    reason,
                    createdAt: { [Op.gt]: new Date(Date.now() - 5 * 60_000) }
                }
            })
            if (!alreadyFlagged) {
                const obs = await ObservationList.create({ userId: req.user.id, reason })
                console.log(`[OBSERVATION] User ${req.user.id} flagged: ${reason}`)

                // ── AI narrative — async, never blocks the request ─────────
                generateBehaviorNarrative(recentLogs, reason)
                    .then(narrative => {
                        if (narrative) {
                            return obs.update({ aiNarrative: narrative })
                        }
                    })
                    .catch(err => console.warn('[HF] narrative update failed:', err.message))
                // ──────────────────────────────────────────────────────────
            }
        }
    } catch (err) {
        console.error('logAction failed:', err.message)
        
    }

    next()
}

module.exports = logAction
