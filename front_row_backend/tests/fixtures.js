const bcrypt = require('bcrypt')
const { Event, EventDate, Ticket, User, Role, Permission } = require('../model/associations')

// ── Seeds the roles + permissions the auth flow depends on. ─────
// Mirrors seed/authSeed.js exactly — kept in sync manually.
async function seedRolesAndPermissions() {
    const PERMISSIONS = [
        'events.create', 'events.update', 'events.delete',
        'tickets.create', 'tickets.update', 'tickets.delete',
        'users.manage', 'events.favorite',
        'admin.observations', 'admin.logs'    // added for Silver challenge
    ]
    const ROLES = {
        admin: PERMISSIONS,
        moderator: [
            'events.create', 'events.update',
            'tickets.create', 'tickets.update',
            'events.favorite',
            'admin.observations', 'admin.logs'
        ],
        user: ['events.favorite']
    }

    const permRecords = await Permission.bulkCreate(PERMISSIONS.map(name => ({ name })))
    const permByName = Object.fromEntries(permRecords.map(p => [p.name, p]))

    const roleByName = {}
    for (const [roleName, permNames] of Object.entries(ROLES)) {
        const role = await Role.create({ name: roleName })
        await role.setPermissions(permNames.map(n => permByName[n]))
        roleByName[roleName] = role
    }
    return roleByName
}

// ── Creates a user with the given role and a known password ───────
async function seedTestUser({ email, role = 'user', password = 'password123' }) {
    const roleRow = await Role.findOne({ where: { name: role } })
    if (!roleRow) throw new Error(`Role "${role}" missing — call seedRolesAndPermissions first`)

    return User.create({
        firstName:   role === 'admin' ? 'Admin' : role === 'moderator' ? 'Moderator' : 'Regular',
        lastName:    'Tester',
        email,
        dateOfBirth: '1990-01-01',
        password:    await bcrypt.hash(password, 4),  // low rounds → fast tests
        roleId:      roleRow.id
    })
}

// ── Domain seed (Events / Tickets / Dates). Auth must already be seeded. ─
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

module.exports = { seedTestData, seedRolesAndPermissions, seedTestUser }
