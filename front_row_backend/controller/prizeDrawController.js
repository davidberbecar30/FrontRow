'use strict'
const prizeDrawService = require('../service/prizeDrawService')

// Admin: start a new draw
async function startDraw(req, res, next) {
    try {
        const { eventId, eventDateId, prizeDescription, durationHours } = req.body
        if (!eventId || !eventDateId || !prizeDescription || !durationHours) {
            return res.status(400).json({ error: 'eventId, eventDateId, prizeDescription and durationHours are required' })
        }
        const draw = await prizeDrawService.startDraw(req.user.id, {
            eventId:          Number(eventId),
            eventDateId:      Number(eventDateId),
            prizeDescription: String(prizeDescription),
            durationHours:    Number(durationHours)
        })
        res.status(201).json(draw)
    } catch (err) {
        next(err)
    }
}

// Admin: list all draws
async function listDraws(req, res, next) {
    try {
        const draws = await prizeDrawService.listDraws()
        res.json(draws)
    } catch (err) {
        next(err)
    }
}

// Public: get active draw (+ whether current user has entered)
async function getActiveDraw(req, res, next) {
    try {
        const draw = await prizeDrawService.getActiveDraw()
        if (!draw) return res.json(null)

        let userOptedIn = false
        if (req.user) {
            userOptedIn = await prizeDrawService.isEntered(req.user.id, draw.id)
        }

        res.json({ ...draw, userOptedIn })
    } catch (err) {
        next(err)
    }
}

// Authenticated: opt in
async function enterDraw(req, res, next) {
    try {
        const drawId = Number(req.params.id)
        const result = await prizeDrawService.enterDraw(req.user.id, drawId)
        res.json(result)
    } catch (err) {
        next(err)
    }
}

// Authenticated: get latest result for this user
async function getMyResult(req, res, next) {
    try {
        const result = await prizeDrawService.getLatestResultForUser(req.user.id)
        res.json(result)
    } catch (err) {
        next(err)
    }
}

module.exports = { startDraw, listDraws, getActiveDraw, enterDraw, getMyResult }
