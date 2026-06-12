'use strict'
const crypto = require('crypto')
const { Op } = require('sequelize')

// In-memory cache of the currently active draw (survives within one process lifetime)
let _cachedDraw  = null   // full payload sent to clients
let _activeTimer = null   // setTimeout handle

// ── Helpers ────────────────────────────────────────────────────────────────

function _broadcast(payload) {
    // Lazy-require to avoid circular module initialisation
    try {
        const { broadcast } = require('../websocket/wsServer')
        broadcast(payload)
    } catch (e) {
        console.error('[prizeDraw] broadcast error', e.message)
    }
}

function _models() {
    return require('../model/associations')
}

async function _buildDrawPayload(draw) {
    const { Event, EventDate } = _models()
    const event = await Event.findByPk(draw.eventId, { attributes: ['id', 'title', 'image', 'category'] })
    const date  = await EventDate.findByPk(draw.eventDateId, { attributes: ['id', 'date', 'venue', 'location'] })
    return {
        id:               draw.id,
        eventId:          draw.eventId,
        eventDateId:      draw.eventDateId,
        prizeDescription: draw.prizeDescription,
        endsAt:           draw.endsAt,
        eventTitle:       event?.title    || '',
        eventImage:       event?.image    || '',
        eventCategory:    event?.category || '',
        eventDate:        date?.date      || '',
        eventVenue:       date?.venue     || '',
        eventLocation:    date?.location  || '',
    }
}

// ── Public API ─────────────────────────────────────────────────────────────

/** Returns the cached payload (fast, for WS on-connect) */
function getCachedActiveDraw() {
    return _cachedDraw
}

/** Returns full active draw from DB (or null). Also refreshes the cache. */
async function getActiveDraw() {
    const { PrizeDraw } = _models()
    const draw = await PrizeDraw.findOne({ where: { status: 'active' } })
    if (!draw) { _cachedDraw = null; return null }
    _cachedDraw = await _buildDrawPayload(draw)
    return _cachedDraw
}

/** Admin: start a new draw */
async function startDraw(adminId, { eventId, eventDateId, prizeDescription, durationHours }) {
    const { PrizeDraw } = _models()

    // Cancel any existing active draw first
    if (_activeTimer) { clearTimeout(_activeTimer); _activeTimer = null }
    await PrizeDraw.update({ status: 'cancelled' }, { where: { status: 'active' } })

    const startedAt = new Date()
    const endsAt    = new Date(startedAt.getTime() + durationHours * 3600 * 1000)

    const draw = await PrizeDraw.create({
        eventId, eventDateId, prizeDescription, durationHours, startedAt, endsAt,
        status: 'active', createdBy: adminId
    })

    _cachedDraw = await _buildDrawPayload(draw)

    // Broadcast to every connected client immediately
    _broadcast({ type: 'PRIZE_DRAW_STARTED', draw: _cachedDraw })

    // Schedule automatic completion
    const delay = Math.max(0, endsAt.getTime() - Date.now())
    _activeTimer = setTimeout(() => completeDraw(draw.id), delay)

    return draw
}

/** User: opt in to a draw */
async function enterDraw(userId, drawId) {
    const { PrizeDraw, PrizeDrawEntry } = _models()

    const draw = await PrizeDraw.findByPk(drawId)
    if (!draw || draw.status !== 'active') {
        const err = new Error('No active draw found'); err.status = 400; throw err
    }
    if (new Date() > new Date(draw.endsAt)) {
        const err = new Error('Draw has already ended'); err.status = 400; throw err
    }

    const [entry, created] = await PrizeDrawEntry.findOrCreate({
        where: { drawId, userId }, defaults: { drawId, userId }
    })

    return { entry, alreadyEntered: !created }
}

/** Returns true if userId is entered in drawId */
async function isEntered(userId, drawId) {
    const { PrizeDrawEntry } = _models()
    const entry = await PrizeDrawEntry.findOne({ where: { userId, drawId } })
    return !!entry
}

/** Get latest completed draw for which this user was an entrant */
async function getLatestResultForUser(userId) {
    const { PrizeDraw, PrizeDrawEntry, User } = _models()

    // Find the most recent completed draw where user opted in
    const entry = await PrizeDrawEntry.findOne({
        where: { userId },
        include: [{
            model: PrizeDraw,
            as: 'draw',
            where: { status: 'completed' },
            required: true
        }],
        order: [[{ model: PrizeDraw, as: 'draw' }, 'endsAt', 'DESC']]
    })
    if (!entry) return null

    const draw = entry.draw
    const payload = await _buildDrawPayload(draw)

    // Load participants
    const entries = await PrizeDrawEntry.findAll({
        where: { drawId: draw.id },
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }]
    })
    const participants = entries
        .filter(e => e.user)
        .map(e => ({ id: e.user.id, name: `${e.user.firstName} ${e.user.lastName}` }))

    let winner = null
    if (draw.winnerId) {
        const w = await User.findByPk(draw.winnerId, { attributes: ['id', 'firstName', 'lastName'] })
        if (w) winner = { id: w.id, name: `${w.firstName} ${w.lastName}` }
    }

    return { draw: payload, winner, participants }
}

/** Admin: list all draws */
async function listDraws() {
    const { PrizeDraw } = _models()
    return PrizeDraw.findAll({ order: [['createdAt', 'DESC']], limit: 50 })
}

// ── Auto-completion (called by setTimeout) ────────────────────────────────

async function completeDraw(drawId) {
    _activeTimer = null
    _cachedDraw  = null

    const { PrizeDraw, PrizeDrawEntry, Purchase, UserTicket, User, sequelize } = _models()

    const draw = await PrizeDraw.findByPk(drawId)
    if (!draw || draw.status !== 'active') return

    const entries = await PrizeDrawEntry.findAll({ where: { drawId } })

    if (entries.length === 0) {
        await draw.update({ status: 'completed', winnerId: null })
        _broadcast({ type: 'PRIZE_DRAW_RESULT', draw: { id: drawId }, winner: null, participants: [] })
        return
    }

    // ── Weighted selection ──────────────────────────────────────────────────
    const userIds = entries.map(e => e.userId)

    // Count total purchased tickets per user (sum of quantities)
    const countRows = await sequelize.query(
        `SELECT "userId", SUM(quantity) AS total
         FROM purchases
         WHERE "userId" IN (:userIds)
         GROUP BY "userId"`,
        { replacements: { userIds }, type: sequelize.QueryTypes.SELECT }
    )
    const weightMap = {}
    ;(countRows || []).forEach(r => { weightMap[r.userId] = parseInt(r.total) || 0 })

    let totalWeight = 0
    const weights = userIds.map(uid => {
        const w = Math.max(1, weightMap[uid] || 0)
        totalWeight += w
        return { userId: uid, weight: w }
    })

    let rand     = Math.random() * totalWeight
    let winnerId = weights[weights.length - 1].userId
    for (const { userId, weight } of weights) {
        rand -= weight
        if (rand <= 0) { winnerId = userId; break }
    }

    // ── Create free prize purchase ─────────────────────────────────────────
    const checkInCode = crypto.randomUUID()
    const purchase = await Purchase.create({
        userId: winnerId,
        eventId: draw.eventId,
        quantity: 1,
        unitPrice: 0.00,
        checkInCode
    })
    await UserTicket.create({ userId: winnerId, purchaseId: purchase.id })

    // ── Persist winner ────────────────────────────────────────────────────
    await draw.update({ status: 'completed', winnerId })

    // ── Build broadcast payload ───────────────────────────────────────────
    const users = await User.findAll({
        where: { id: userIds },
        attributes: ['id', 'firstName', 'lastName']
    })
    const participants = users.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}` }))
    const winnerUser   = users.find(u => u.id === winnerId)
    const winner       = winnerUser
        ? { id: winnerUser.id, name: `${winnerUser.firstName} ${winnerUser.lastName}` }
        : null

    const drawPayload = await _buildDrawPayload(draw)

    _broadcast({ type: 'PRIZE_DRAW_RESULT', draw: drawPayload, winner, participants })
}

// ── Restart pending draws on server boot ─────────────────────────────────

async function schedulePendingDraws() {
    const { PrizeDraw } = _models()
    const draw = await PrizeDraw.findOne({ where: { status: 'active' } })
    if (!draw) return

    _cachedDraw = await _buildDrawPayload(draw)

    const delay = new Date(draw.endsAt).getTime() - Date.now()
    if (delay <= 0) {
        console.log('[prizeDraw] Active draw already expired — completing now')
        await completeDraw(draw.id)
    } else {
        console.log(`[prizeDraw] Rescheduling active draw #${draw.id} in ${Math.round(delay / 1000)}s`)
        _activeTimer = setTimeout(() => completeDraw(draw.id), delay)
    }
}

module.exports = {
    getCachedActiveDraw,
    getActiveDraw,
    startDraw,
    enterDraw,
    isEntered,
    getLatestResultForUser,
    listDraws,
    schedulePendingDraws,
}
