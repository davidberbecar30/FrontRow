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

const PORT = 3000
const HOST = '0.0.0.0'

// ── Build HTTPS server if certs exist, otherwise fall back to HTTP ──
const CERT_DIR = path.join(__dirname, 'certs')
const KEY_PATH  = path.join(CERT_DIR, 'server.key')
const CERT_PATH = path.join(CERT_DIR, 'server.cert')

let server
let protocol
if (fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)) {
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

    const count = await Event.count()
    if (count > 0) {
        console.log(`6a. ${count} events already exist — skipping initial seed`)
        return
    }

    const INITIAL_EVENTS = 12
    for (let i = 0; i < INITIAL_EVENTS; i++) {
        const { dates, ...fields } = generateFakeEvent()
        const event = await Event.create(fields)
        if (dates.length > 0) {
            await EventDate.bulkCreate(
                dates.map(d => ({ ...d, eventId: event.id }))
            )
        }
    }
    console.log(`6a. Seeded ${INITIAL_EVENTS} initial events`)
}

async function start() {
    try {
        console.log('3. about to authenticate')
        await sequelize.authenticate()
        console.log('4. authenticated')

        // alter:true adds new columns (e.g. aiNarrative) without dropping existing data
        await sequelize.sync({ alter: true })
        console.log('5. synced')

        await createIndices()
        console.log('5a. indices created')

        await seedAuth()
        console.log('6. auth seeded')

        await seedInitialEvents()
        console.log('6b. initial events seeded')

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
