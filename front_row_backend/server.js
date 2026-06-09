const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

const app = require('./app')
console.log('1. requires loaded')

const { sequelize } = require('./model/associations.js')
const { seedAuth } = require('./seed/authSeed')
const { createIndices } = require('./seed/createIndices')
const { connectMongo } = require('./mongoDb')
console.log('2. associations loaded')

const { initWebSocket } = require('./websocket/wsServer')

const PORT = process.env.PORT || 3000
const HOST = '0.0.0.0'

// ── Build HTTPS server if certs exist, otherwise fall back to HTTP ──
const CERT_DIR = path.join(__dirname, 'certs')
const KEY_PATH  = path.join(CERT_DIR, 'server.key')
const CERT_PATH = path.join(CERT_DIR, 'server.cert')

let server
let protocol
if (process.env.NODE_ENV !== 'development' && fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)) {
    server = https.createServer(
        {
            key:  fs.readFileSync(KEY_PATH),
            cert: fs.readFileSync(CERT_PATH)
        },
        app
    )
    protocol = 'https'
} else {
    console.warn('No certs found in /certs — falling back to HTTP. Run the openssl command in the README to generate them.')
    server = http.createServer(app)
    protocol = 'http'
}

initWebSocket(server)   // Attaches WebSocket to the same server (becomes wss:// when HTTPS is used)

/**
 * Seed a handful of initial events so the UI has data on first load.
 * Does nothing if events already exist.
 */
async function seedInitialEvents() {
    const { Event, EventDate } = require('./model/associations')
    const { generateFakeEvent } = require('./faker/eventGenerator')
    const repository = require('./repository/repository')

    const count = await Event.count()
    if (count > 0) {
        console.log(`6a. ${count} events already exist — skipping initial seed`)
        return
    }

    const INITIAL_EVENTS = 12
    for (let i = 0; i < INITIAL_EVENTS; i++) {
        const { dates, ...fields } = generateFakeEvent()
        const event = await Event.create(fields)
        let createdDates = []
        if (dates.length > 0) {
            await EventDate.bulkCreate(dates.map(d => ({ ...d, eventId: event.id })))
            createdDates = await EventDate.findAll({ where: { eventId: event.id } })
        }
        // Use repository helper so tickets get eventDateId and counts are synced
        await repository._generateTickets(event.id, Number(event.price), createdDates)
    }
    console.log(`6a. Seeded ${INITIAL_EVENTS} initial events with tickets`)
}

// Populate EventDate.availableTickets for any rows still at 0 (existing data
// Assign undated tickets to event_dates (round-robin) and sync all
// EventDate.availableTickets from actual ticket row counts.
async function backfillEventDateTickets() {
    const { sequelize: db } = require('./model/associations')
    const repository = require('./repository/repository')

    // 1. Delete legacy tickets that have no eventDateId — they can't be synced
    //    and will just show up as 0. Regenerate them properly below.
    const [, deleteMeta] = await db.query(
        `DELETE FROM tickets WHERE "eventDateId" IS NULL`
    )
    const deleted = deleteMeta?.rowCount ?? 0
    if (deleted > 0) console.log(`6c. Removed ${deleted} legacy undated tickets`)

    // 2. For every event_date that now has 0 ticket rows, generate a fresh set
    const [datesToFill] = await db.query(`
        SELECT ed.id, ed."eventId", e.price
        FROM event_dates ed
        JOIN events e ON e.id = ed."eventId"
        WHERE (
            SELECT COUNT(*) FROM tickets t WHERE t."eventDateId" = ed.id
        ) = 0
    `)
    let generated = 0
    for (const row of datesToFill) {
        // Create a plain object that _generateTickets can use (just needs .id)
        await repository._generateTickets(row.eventId, Number(row.price), [{ id: row.id }])
        generated++
    }
    if (generated > 0) console.log(`6c. Generated tickets for ${generated} dates`)

    // 3. Sync ALL event_dates.availableTickets in one SQL statement
    await db.query(`
        UPDATE event_dates ed
        SET "availableTickets" = (
            SELECT COUNT(*) FROM tickets t
            WHERE t."eventDateId" = ed.id AND t.status = 'available'
        )
    `)
    console.log('6c. Synced all event_dates availableTickets from ticket rows')
}

async function start() {
    try {
        console.log('3. about to authenticate')
        await sequelize.authenticate()
        console.log('4. authenticated')

        // alter:true adds new columns (e.g. aiNarrative) without dropping existing data
        await sequelize.sync({ alter: true })
        console.log('5. synced')

        // Explicit migration: ensure event_dates and tickets have the columns we need.
        // ALTER TABLE ... ADD COLUMN IF NOT EXISTS is idempotent — safe to run every time.
        await sequelize.query(`
            ALTER TABLE event_dates
                ADD COLUMN IF NOT EXISTS "availableTickets" INTEGER NOT NULL DEFAULT 0;
            ALTER TABLE tickets
                ADD COLUMN IF NOT EXISTS "eventDateId" INTEGER REFERENCES event_dates(id)
                    ON DELETE SET NULL ON UPDATE CASCADE;
            ALTER TABLE purchases
                ADD COLUMN IF NOT EXISTS "outfitSuggestion" JSONB DEFAULT NULL;
        `)
        console.log('5b. explicit column migrations done')

        await createIndices()
        console.log('5a. indices created')

        await seedAuth()
        console.log('6. auth seeded')

        await seedInitialEvents()
        console.log('6b. initial events seeded')

        await backfillEventDateTickets()
        console.log('6c. event_dates availableTickets backfilled')

        await connectMongo()
        console.log('7. mongo connected')

        server.listen(PORT, HOST, () => {
            console.log(`Server running on ${protocol}://localhost:${PORT}`)
            console.log(`WebSocket: ${protocol === 'https' ? 'wss' : 'ws'}://localhost:${PORT}`)
        })
    } catch (err) {
        console.error('ERROR:', err)
        process.exit(1)
    }
}

start()
