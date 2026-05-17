/**
 * bulkSeed.js — fills the DB with large-scale realistic data for performance testing.
 *
 * Targets:
 *   events       →  1 000 rows
 *   event_dates  →  3 000 rows  (~3 per event)
 *   tickets      → 10 000 rows  (~10 per event)
 *
 * Usage:
 *   node seed/bulkSeed.js          (run directly)
 *   POST /faker/bulk-seed          (via HTTP)
 */

const { faker } = require('@faker-js/faker')
const { Event, EventDate, Ticket } = require('../model/associations')

const CATEGORIES = ['Concert', 'Sports', 'Magic', 'Festival', 'Theater']
const VENUES = [
    'Madison Square Garden', 'Crypto.com Arena', 'Wembley Stadium',
    'Hollywood Bowl', 'MGM Grand Garden Arena', 'Golden 1 Center',
    'Bridgestone Arena', 'United Center', 'O2 Arena', 'Staples Center',
    'TD Garden', 'American Airlines Arena', 'Chase Center', 'Barclays Center'
]
const LOCATIONS = [
    'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Nashville, TN',
    'Las Vegas, NV', 'Sacramento, CA', 'Atlanta, GA', 'London, UK',
    'Boston, MA', 'Miami, FL', 'Dallas, TX', 'Seattle, WA'
]
const SECTIONS  = ['VIP', 'Standard', 'Balcony', 'Floor', 'General Admission']
const STATUSES  = ['available', 'sold', 'reserved']
const STATUS_WEIGHTS = [0.5, 0.4, 0.1]   // 50% available, 40% sold, 10% reserved

function weightedStatus() {
    const r = Math.random()
    if (r < STATUS_WEIGHTS[0]) return STATUSES[0]
    if (r < STATUS_WEIGHTS[0] + STATUS_WEIGHTS[1]) return STATUSES[1]
    return STATUSES[2]
}

/** Insert records in chunks to avoid hitting postgres parameter limits */
async function bulkInsertChunked(Model, records, chunkSize = 500) {
    for (let i = 0; i < records.length; i += chunkSize) {
        await Model.bulkCreate(records.slice(i, i + chunkSize), { validate: false })
    }
}

async function runBulkSeed({ events = 1000 } = {}) {
    const start = Date.now()
    console.log(`[BulkSeed] Starting — target: ${events} events…`)

    // ── 1. Events ────────────────────────────────────────────────────────────
    const eventRows = []
    for (let i = 0; i < events; i++) {
        const category = faker.helpers.arrayElement(CATEGORIES)
        const price    = faker.number.int({ min: 20, max: 500 })
        eventRows.push({
            title:            `${faker.person.firstName()} ${faker.helpers.arrayElement(['Tour', 'Live', 'Show', 'Concert', 'Experience'])}`,
            description:      faker.lorem.sentence(),
            category,
            price,
            availableTickets: faker.number.int({ min: 50, max: 5000 }),
            image:            null,
            favorited:        false,
            createdAt:        new Date(),
            updatedAt:        new Date()
        })
    }
    await bulkInsertChunked(Event, eventRows)
    console.log(`[BulkSeed] ✓ ${events} events inserted`)

    // Fetch their IDs (we need them for the FK relations)
    const createdEvents = await Event.findAll({
        attributes: ['id', 'price'],
        order: [['id', 'DESC']],
        limit: events
    })
    const eventIds = createdEvents.map(e => ({ id: e.id, price: Number(e.price) }))

    // ── 2. Event Dates (~3 per event) ────────────────────────────────────────
    const dateRows = []
    for (const { id: eventId } of eventIds) {
        const numDates = faker.number.int({ min: 1, max: 5 })
        for (let d = 0; d < numDates; d++) {
            dateRows.push({
                eventId,
                date:      faker.date.future().toISOString().split('T')[0],
                location:  faker.helpers.arrayElement(LOCATIONS),
                venue:     faker.helpers.arrayElement(VENUES),
                createdAt: new Date(),
                updatedAt: new Date()
            })
        }
    }
    await bulkInsertChunked(EventDate, dateRows)
    console.log(`[BulkSeed] ✓ ${dateRows.length} event_dates inserted`)

    // ── 3. Tickets (~10 per event) ───────────────────────────────────────────
    const ticketRows = []
    for (const { id: eventId, price: basePrice } of eventIds) {
        const numTickets = faker.number.int({ min: 5, max: 20 })
        for (let t = 0; t < numTickets; t++) {
            ticketRows.push({
                eventId,
                seat:      `${faker.string.alpha({ length: 1, casing: 'upper' })}${faker.number.int({ min: 1, max: 200 })}`,
                section:   faker.helpers.arrayElement(SECTIONS),
                status:    weightedStatus(),
                price:     faker.number.int({ min: Math.max(10, basePrice - 50), max: basePrice + 100 }),
                createdAt: new Date(),
                updatedAt: new Date()
            })
        }
    }
    await bulkInsertChunked(Ticket, ticketRows)
    console.log(`[BulkSeed] ✓ ${ticketRows.length} tickets inserted`)

    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    const summary = {
        events:     events,
        eventDates: dateRows.length,
        tickets:    ticketRows.length,
        elapsedSec: Number(elapsed)
    }
    console.log(`[BulkSeed] Done in ${elapsed}s`, summary)
    return summary
}

module.exports = { runBulkSeed }

// Allow running directly: node seed/bulkSeed.js
if (require.main === module) {
    require('../model/associations')   // ensure models are registered
    runBulkSeed()
        .then(r => { console.log('Done:', r); process.exit(0) })
        .catch(e => { console.error(e); process.exit(1) })
}
