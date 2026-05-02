const { Event, EventDate, Ticket } = require('../model/associations')

async function seedTestData() {
    const drake = await Event.create({
        title: 'Drake Tour',
        description: 'Drake performing live.',
        category: 'Concert',
        price: 135,
        availableTickets: 200,
        favorited: true
    })
    const bruno = await Event.create({
        title: 'Bruno Mars Show',
        description: 'Bruno Mars live.',
        category: 'Concert',
        price: 89,
        availableTickets: 150,
        favorited: false
    })
    const lakers = await Event.create({
        title: 'Lakers vs Kings',
        description: 'NBA matchup.',
        category: 'Sports',
        price: 38,
        availableTickets: 500,
        favorited: false
    })
    const blaine = await Event.create({
        title: 'David Blaine Magic',
        description: 'Magic show.',
        category: 'Magic',
        price: 215,
        availableTickets: 100,
        favorited: false
    })

    await EventDate.bulkCreate([
        { eventId: drake.id,  date: '2026-08-24', location: 'Los Angeles, CA', venue: 'Crypto.com Arena' },
        { eventId: drake.id,  date: '2026-09-01', location: 'New York, NY',    venue: 'Madison Square Garden' },
        { eventId: bruno.id,  date: '2026-09-12', location: 'Nashville, TN',   venue: 'Bridgestone Arena' },
        { eventId: lakers.id, date: '2026-12-06', location: 'Sacramento, CA',  venue: 'Golden 1 Center' },
        { eventId: blaine.id, date: '2026-10-03', location: 'New York, NY',    venue: 'Madison Square Garden' }
    ])

    await Ticket.bulkCreate([
        { eventId: drake.id,  seat: 'A1', section: 'VIP',      status: 'available', price: 200 },
        { eventId: drake.id,  seat: 'A2', section: 'VIP',      status: 'sold',      price: 200 },
        { eventId: drake.id,  seat: 'B1', section: 'Standard', status: 'available', price: 135 },
        { eventId: bruno.id,  seat: 'A1', section: 'VIP',      status: 'available', price: 150 },
        { eventId: bruno.id,  seat: 'B1', section: 'Standard', status: 'sold',      price: 89 },
        { eventId: lakers.id, seat: 'C1', section: 'Standard', status: 'available', price: 38 }
    ])

    return { drake, bruno, lakers, blaine }
}

module.exports = { seedTestData }
