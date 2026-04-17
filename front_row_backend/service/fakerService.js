const { generateFakeEvent } = require('../faker/eventGenerator')
const { broadcast } = require('../websocket/wsServer')
const repository = require('../repository/repository')
const { Event } = require('../model/Event')

let fakerInterval = null
const INTERVAL_MS = 3000

function startFakerLoop() {
    if (fakerInterval) return { message: 'Faker loop already running' }

    fakerInterval = setInterval(() => {
        const fakeData = generateFakeEvent()
        const newEvent = new Event(fakeData)
        repository.events.push(newEvent)

        console.log(`Generated fake event: ${newEvent.title}`)


        broadcast({
            type: 'NEW_EVENT',
            data: newEvent
        })
    }, INTERVAL_MS)

    return { message: 'Faker loop started' }
}

function stopFakerLoop() {
    if (!fakerInterval) return { message: 'Faker loop is not running' }
    clearInterval(fakerInterval)
    fakerInterval = null
    return { message: 'Faker loop stopped' }
}

function isRunning() {
    return fakerInterval !== null
}

module.exports = { startFakerLoop, stopFakerLoop, isRunning }