/**
 * simulatorController.js
 *
 * POST /faker/simulate
 *
 * Runs three suspicious-behaviour scenarios directly against the service layer
 * (no HTTP-to-self) and returns a structured result so the Admin Demo Panel
 * can display what was triggered in real time.
 *
 * Scenarios
 * ─────────
 *  1. Rate Spike      — creates 35 Log rows for the bot user and runs the
 *                       detectors, which fires the rate-spike observation.
 *
 *  2. Privilege Probe — runs the detectors with fake admin-only requests
 *                       (POST /events, PUT /events/1, DELETE /events/1)
 *                       attributed to the bot user (role: user).
 *
 *  3. Toxic Chat      — calls classifyToxicity on two toxic and one safe
 *                       message and reports the AI decision for each.
 */

const bcrypt = require('bcrypt')
const { User, Role, Log, ObservationList } = require('../model/associations')
const { runDetectors } = require('../service/detectorService')
const { classifyToxicity, generateBehaviorNarrative } = require('../service/hfService')

const BOT_EMAIL = 'sim-bot@frontrow.dev'
const BOT_PASS  = 'SimBot123!'

// ── helpers ───────────────────────────────────────────────────────────────────

async function getOrCreateBot() {
    let bot = await User.findOne({ where: { email: BOT_EMAIL } })
    if (bot) return bot

    const role = await Role.findOne({ where: { name: 'user' } })
    bot = await User.create({
        firstName:   'Sim',
        lastName:    'Bot',
        email:       BOT_EMAIL,
        dateOfBirth: '2000-01-01',
        password:    await bcrypt.hash(BOT_PASS, 10),
        roleId:      role.id
    })
    return bot
}

async function createObservation(userId, reason, recentLogs) {
    const obs = await ObservationList.create({ userId, reason })
    // Fire AI narrative asynchronously — never block the response
    generateBehaviorNarrative(recentLogs, reason)
        .then(narrative => narrative && obs.update({ aiNarrative: narrative }))
        .catch(err => console.warn('[SIM] narrative failed:', err.message))
    return obs
}

// ── main handler ──────────────────────────────────────────────────────────────

async function simulate(req, res, next) {
    try {
        const bot = await getOrCreateBot()
        const report = {
            botUser:       bot.email,
            rateSpike:     { triggered: false, reason: null },
            privilegeProbe: [],
            toxicChat:     []
        }

        // ── 1. Rate Spike ─────────────────────────────────────────────────────
        // Create 35 log entries in one bulkCreate so they all land within the
        // same 10-second window that the detector inspects.
        const logRows = Array.from({ length: 35 }, () => ({
            userId:   bot.id,
            roleName: 'user',
            method:   'GET',
            path:     '/events',
            action:   'GET /events'
        }))
        const createdLogs = await Log.bulkCreate(logRows)

        const fakeRateReq = { user: { id: bot.id, role: 'user' }, method: 'GET', path: '/events' }
        const rateReasons = runDetectors(fakeRateReq, createdLogs)

        for (const reason of rateReasons) {
            await createObservation(bot.id, reason, createdLogs)
            report.rateSpike = { triggered: true, reason }
        }

        // ── 2. Privilege Probe ────────────────────────────────────────────────
        const probeAttempts = [
            { method: 'POST',   path: '/events'   },
            { method: 'PUT',    path: '/events/1'  },
            { method: 'DELETE', path: '/events/1'  }
        ]

        for (const { method, path } of probeAttempts) {
            const probeReq = { user: { id: bot.id, role: 'user' }, method, path }
            const reasons  = runDetectors(probeReq, createdLogs)

            for (const reason of reasons) {
                // De-dup: don't create a second observation for the same reason
                const alreadyExists = await ObservationList.findOne({
                    where: { userId: bot.id, reason }
                })
                if (!alreadyExists) {
                    await createObservation(bot.id, reason, createdLogs)
                }
                report.privilegeProbe.push({ method, path, reason })
            }
        }

        // ── 3. Toxic Chat ─────────────────────────────────────────────────────
        const THRESHOLD = 0.80
        const testMessages = [
            { text: 'I hate you, you are disgusting and I hope you die.',     expectBlocked: true  },
            { text: 'You are worthless garbage, go kill yourself.',            expectBlocked: true  },
            { text: 'Looking forward to the Drake concert on Friday!',         expectBlocked: false },
        ]

        for (const { text, expectBlocked } of testMessages) {
            const toxicity = await classifyToxicity(text)
            const blocked  = toxicity?.label === 'toxic' && toxicity.score >= THRESHOLD
            report.toxicChat.push({
                text:     text.slice(0, 70),
                label:    toxicity?.label   ?? 'unavailable',
                score:    toxicity           ? Math.round(toxicity.score * 100) : null,
                blocked,
                expected: expectBlocked
            })
        }

        return res.status(200).json({ message: 'Simulation complete', ...report })
    } catch (err) {
        next(err)
    }
}

module.exports = { simulate }
