const request = require('supertest')
const app = require('../app')
const { sequelize, Ticket, EventDate } = require('../model/associations')
const { seedTestData, seedRolesAndPermissions, seedTestUser, fullLogin } = require('./fixtures')

let adminToken
let userToken

beforeAll(async () => {
    await sequelize.sync({ force: true })
})

beforeEach(async () => {
    await sequelize.sync({ force: true })
    await seedRolesAndPermissions()
    await seedTestUser({ email: 'admin@x.com', password: 'pw', role: 'admin' })
    await seedTestUser({ email: 'user@x.com',  password: 'pw' })
    adminToken = (await fullLogin('admin@x.com', 'pw')).token
    userToken  = (await fullLogin('user@x.com',  'pw')).token

    await seedTestData()
})

afterAll(async () => {
    await sequelize.close()
})

// Helper: attach a Bearer header
const bearer = t => ({ Authorization: `Bearer ${t}` })

// ──────────────────────────────────────────────────────────────────────
// GET /events  (public)
// ──────────────────────────────────────────────────────────────────────

describe('GET /events', () => {
    it('returns paginated events with correct shape', async () => {
        const res = await request(app).get('/events?limit=4')
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('data')
        expect(res.body).toHaveProperty('pagination')
        expect(res.body.data).toHaveLength(4)
        expect(res.body.pagination.total).toBe(4)
        expect(res.body.pagination.totalPages).toBe(1)
    })

    it('paginates correctly with page and limit', async () => {
        const res = await request(app).get('/events?page=1&limit=2')
        expect(res.status).toBe(200)
        expect(res.body.data).toHaveLength(2)
        expect(res.body.pagination.currentPage).toBe(1)
        expect(res.body.pagination.limit).toBe(2)
        expect(res.body.pagination.totalPages).toBe(2)
    })

    it('returns the second page', async () => {
        const res = await request(app).get('/events?page=2&limit=2')
        expect(res.status).toBe(200)
        expect(res.body.data).toHaveLength(2)
        expect(res.body.pagination.currentPage).toBe(2)
    })

    it('filters by category', async () => {
        const res = await request(app).get('/events?category=Concert')
        expect(res.status).toBe(200)
        expect(res.body.data.length).toBeGreaterThan(0)
        res.body.data.forEach(e => expect(e.category).toBe('Concert'))
    })

    it('filters by case-insensitive search', async () => {
        const res = await request(app).get('/events?search=drake')
        expect(res.status).toBe(200)
        expect(res.body.data.length).toBeGreaterThan(0)
        res.body.data.forEach(e => expect(e.title.toLowerCase()).toContain('drake'))
    })

    it('returns empty array when no match', async () => {
        const res = await request(app).get('/events?search=nonexistent_xyz')
        expect(res.status).toBe(200)
        expect(res.body.data).toHaveLength(0)
        expect(res.body.pagination.total).toBe(0)
    })

    it('eager-loads dates relation', async () => {
        const res = await request(app).get('/events')
        const drake = res.body.data.find(e => e.title === 'Drake Tour')
        expect(drake.dates).toBeDefined()
        expect(Array.isArray(drake.dates)).toBe(true)
        expect(drake.dates.length).toBe(2)
        expect(drake.dates[0]).toHaveProperty('venue')
    })
})

// ──────────────────────────────────────────────────────────────────────
// GET /events/statistics  (public)
// ──────────────────────────────────────────────────────────────────────

describe('GET /events/statistics', () => {
    it('returns expected statistics shape', async () => {
        const res = await request(app).get('/events/statistics')
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('totalEvents', 4)
        expect(res.body).toHaveProperty('categoryBreakdown')
        expect(res.body).toHaveProperty('trending')
        expect(res.body).toHaveProperty('ticketsAvailability')
    })

    it('counts events by category correctly', async () => {
        const res = await request(app).get('/events/statistics')
        expect(res.body.categoryBreakdown.Concert).toBe(2)
        expect(res.body.categoryBreakdown.Sports).toBe(1)
        expect(res.body.categoryBreakdown.Magic).toBe(1)
    })

    it('returns trending sorted by price descending', async () => {
        const res = await request(app).get('/events/statistics')
        const trending = res.body.trending
        expect(trending.length).toBeGreaterThan(0)
        for (let i = 0; i < trending.length - 1; i++) {
            expect(Number(trending[i].price)).toBeGreaterThanOrEqual(
                Number(trending[i + 1].price)
            )
        }
    })

    it('returns ticketsAvailability per event', async () => {
        const res = await request(app).get('/events/statistics')
        expect(res.body.ticketsAvailability).toHaveLength(4)
        res.body.ticketsAvailability.forEach(e => {
            expect(e).toHaveProperty('id')
            expect(e).toHaveProperty('title')
            expect(e).toHaveProperty('availableTickets')
        })
    })
})

// ──────────────────────────────────────────────────────────────────────
// GET /events/:id  (public)
// ──────────────────────────────────────────────────────────────────────

describe('GET /events/:id', () => {
    it('returns event by id with dates', async () => {
        const list = await request(app).get('/events')
        const target = list.body.data[0]
        const res = await request(app).get(`/events/${target.id}`)
        expect(res.status).toBe(200)
        expect(res.body.id).toBe(target.id)
        expect(res.body).toHaveProperty('dates')
        expect(Array.isArray(res.body.dates)).toBe(true)
    })

    it('returns 404 for non-existent id', async () => {
        const res = await request(app).get('/events/99999')
        expect(res.status).toBe(404)
        expect(res.body).toHaveProperty('message')
    })
})

// ──────────────────────────────────────────────────────────────────────
// POST /events  (admin-only)
// ──────────────────────────────────────────────────────────────────────

describe('POST /events', () => {
    const validBody = {
        title: 'New Concert',
        description: 'A new event',
        category: 'Concert',
        price: 99,
        availableTickets: 200,
        dates: [{ date: '2027-01-01', location: 'Berlin, DE', venue: 'Mercedes-Benz Arena' }]
    }

    it('creates a new event with dates (admin)', async () => {
        const res = await request(app).post('/events').set(bearer(adminToken)).send(validBody)
        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('id')
        expect(res.body.title).toBe('New Concert')
        expect(res.body.dates).toHaveLength(1)
        expect(res.body.dates[0].venue).toBe('Mercedes-Benz Arena')
    })

    it('persists the event so it appears in the list', async () => {
        const before = await request(app).get('/events')
        await request(app).post('/events').set(bearer(adminToken)).send(validBody)
        const after = await request(app).get('/events')
        expect(after.body.pagination.total).toBe(before.body.pagination.total + 1)
    })

    it('rejects missing title with 400', async () => {
        const { title, ...rest } = validBody
        const res = await request(app).post('/events').set(bearer(adminToken)).send(rest)
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('errors')
    })

    it('rejects negative price with 400', async () => {
        const res = await request(app).post('/events').set(bearer(adminToken)).send({ ...validBody, price: -10 })
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('errors')
    })

    it('rejects bad date format with 400', async () => {
        const res = await request(app).post('/events').set(bearer(adminToken)).send({
            ...validBody,
            dates: [{ date: 'not-a-date', location: 'X', venue: 'Y' }]
        })
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('errors')
    })

    it('rejects empty dates array with 400', async () => {
        const res = await request(app).post('/events').set(bearer(adminToken)).send({ ...validBody, dates: [] })
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('errors')
    })
})

// ──────────────────────────────────────────────────────────────────────
// PUT /events/:id  (admin-only)
// ──────────────────────────────────────────────────────────────────────

describe('PUT /events/:id', () => {
    const validUpdate = {
        title: 'Drake Tour Renamed',
        description: 'Updated description',
        category: 'Concert',
        price: 150,
        availableTickets: 180,
        dates: [{ date: '2027-08-08', location: 'London, UK', venue: 'Wembley Stadium' }]
    }

    it('updates an existing event and replaces dates (admin)', async () => {
        const list = await request(app).get('/events')
        const target = list.body.data.find(e => e.title === 'Drake Tour')
        const res = await request(app).put(`/events/${target.id}`).set(bearer(adminToken)).send(validUpdate)
        expect(res.status).toBe(200)
        expect(res.body.title).toBe('Drake Tour Renamed')
        expect(res.body.dates).toHaveLength(1)
        expect(res.body.dates[0].venue).toBe('Wembley Stadium')
    })

    it('returns 404 for non-existent id', async () => {
        const res = await request(app).put('/events/99999').set(bearer(adminToken)).send(validUpdate)
        expect(res.status).toBe(404)
    })
})

// ──────────────────────────────────────────────────────────────────────
// DELETE /events/:id  (admin-only)
// ──────────────────────────────────────────────────────────────────────

describe('DELETE /events/:id', () => {
    it('deletes an existing event (admin)', async () => {
        const list = await request(app).get('/events')
        const target = list.body.data[0]
        const del = await request(app).delete(`/events/${target.id}`).set(bearer(adminToken))
        expect(del.status).toBe(200)

        const after = await request(app).get(`/events/${target.id}`)
        expect(after.status).toBe(404)
    })

    it('cascades: deleting an event removes its tickets and dates', async () => {
        const list = await request(app).get('/events')
        const drake = list.body.data.find(e => e.title === 'Drake Tour')

        const ticketsBefore = await Ticket.findAll({ where: { eventId: drake.id } })
        const datesBefore   = await EventDate.findAll({ where: { eventId: drake.id } })
        expect(ticketsBefore.length).toBeGreaterThan(0)
        expect(datesBefore.length).toBeGreaterThan(0)

        await request(app).delete(`/events/${drake.id}`).set(bearer(adminToken))

        const ticketsAfter = await Ticket.findAll({ where: { eventId: drake.id } })
        const datesAfter   = await EventDate.findAll({ where: { eventId: drake.id } })
        expect(ticketsAfter).toHaveLength(0)
        expect(datesAfter).toHaveLength(0)
    })

    it('returns 404 for non-existent id', async () => {
        const res = await request(app).delete('/events/99999').set(bearer(adminToken))
        expect(res.status).toBe(404)
    })
})

// ──────────────────────────────────────────────────────────────────────
// PATCH /events/:id/favorite  (any authenticated user)
// ──────────────────────────────────────────────────────────────────────

describe('PATCH /events/:id/favorite', () => {
    it('toggles favorite from true to false', async () => {
        const list = await request(app).get('/events')
        const drake = list.body.data.find(e => e.title === 'Drake Tour')
        expect(drake.favorited).toBe(true)

        const res = await request(app).patch(`/events/${drake.id}/favorite`).set(bearer(userToken))
        expect(res.status).toBe(200)
        expect(res.body.favorited).toBe(false)
    })

    it('toggles favorite from false to true', async () => {
        const list = await request(app).get('/events')
        const bruno = list.body.data.find(e => e.title === 'Bruno Mars Show')
        expect(bruno.favorited).toBe(false)

        const res = await request(app).patch(`/events/${bruno.id}/favorite`).set(bearer(userToken))
        expect(res.status).toBe(200)
        expect(res.body.favorited).toBe(true)
    })

    it('returns 404 for non-existent id', async () => {
        const res = await request(app).patch('/events/99999/favorite').set(bearer(userToken))
        expect(res.status).toBe(404)
    })

    it('returns 401 without a token', async () => {
        const res = await request(app).patch('/events/1/favorite')
        expect(res.status).toBe(401)
    })
})


describe('404 handler', () => {
    it('returns 404 for unknown routes', async () => {
        const res = await request(app).get('/unknown-route-xyz')
        expect(res.status).toBe(404)
    })
})
