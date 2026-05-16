const request = require('supertest')
const app = require('../app')
const { sequelize } = require('../model/associations')
const { seedTestData, seedRolesAndPermissions, seedTestUser } = require('./fixtures')

let adminToken

beforeAll(async () => {
    await sequelize.sync({ force: true })
})

beforeEach(async () => {
    await sequelize.sync({ force: true })
    await seedRolesAndPermissions()
    await seedTestUser({ email: 'admin@x.com', password: 'pw', role: 'admin' })
    const adminRes = await request(app).post('/auth/login').send({ email: 'admin@x.com', password: 'pw' })
    adminToken = adminRes.body.token

    await seedTestData()
})

afterAll(async () => {
    await sequelize.close()
})

const bearer = t => ({ Authorization: `Bearer ${t}` })

async function getEventIdByTitle(title) {
    const res = await request(app).get(`/events?search=${encodeURIComponent(title)}`)
    return res.body.data[0]?.id
}

// ──────────────────────────────────────────────────────────────────────
// GET /events/:eventId/tickets  (public)
// ──────────────────────────────────────────────────────────────────────

describe('GET /events/:eventId/tickets', () => {
    it('returns all tickets for the event', async () => {
        const id = await getEventIdByTitle('Drake')
        const res = await request(app).get(`/events/${id}/tickets`)
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body)).toBe(true)
        expect(res.body.length).toBe(3)
        res.body.forEach(t => expect(t.eventId).toBe(id))
    })

    it('returns empty array for an event with no tickets', async () => {
        const id = await getEventIdByTitle('Blaine')
        const res = await request(app).get(`/events/${id}/tickets`)
        expect(res.status).toBe(200)
        expect(res.body).toHaveLength(0)
    })

    it('returns 404 when the event does not exist', async () => {
        const res = await request(app).get('/events/99999/tickets')
        expect(res.status).toBe(404)
    })
})

// ──────────────────────────────────────────────────────────────────────
// POST /events/:eventId/tickets  (admin)
// ──────────────────────────────────────────────────────────────────────

describe('POST /events/:eventId/tickets', () => {
    it('creates a ticket linked to the event (admin)', async () => {
        const id = await getEventIdByTitle('Drake')
        const res = await request(app)
            .post(`/events/${id}/tickets`)
            .set(bearer(adminToken))
            .send({ seat: 'Z9', section: 'VIP', status: 'available', price: 250 })
        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('id')
        expect(res.body.eventId).toBe(id)
        expect(res.body.seat).toBe('Z9')
        expect(res.body.status).toBe('available')
    })

    it('defaults status to "available" when omitted', async () => {
        const id = await getEventIdByTitle('Drake')
        const res = await request(app)
            .post(`/events/${id}/tickets`)
            .set(bearer(adminToken))
            .send({ seat: 'Z10', section: 'VIP', price: 250 })
        expect(res.status).toBe(201)
        expect(res.body.status).toBe('available')
    })

    it('returns 404 when the event does not exist', async () => {
        const res = await request(app)
            .post('/events/99999/tickets')
            .set(bearer(adminToken))
            .send({ seat: 'Z9', section: 'VIP', status: 'available', price: 250 })
        expect(res.status).toBe(404)
    })
})

// ──────────────────────────────────────────────────────────────────────
// GET /tickets/:id  (public)
// ──────────────────────────────────────────────────────────────────────

describe('GET /tickets/:id', () => {
    it('returns a single ticket by id', async () => {
        const eventId = await getEventIdByTitle('Drake')
        const list = await request(app).get(`/events/${eventId}/tickets`)
        const ticketId = list.body[0].id

        const res = await request(app).get(`/tickets/${ticketId}`)
        expect(res.status).toBe(200)
        expect(res.body.id).toBe(ticketId)
    })

    it('returns 404 for non-existent ticket', async () => {
        const res = await request(app).get('/tickets/99999')
        expect(res.status).toBe(404)
    })
})

// ──────────────────────────────────────────────────────────────────────
// PUT /tickets/:id  (admin)
// ──────────────────────────────────────────────────────────────────────

describe('PUT /tickets/:id', () => {
    it('updates a ticket (admin)', async () => {
        const eventId = await getEventIdByTitle('Drake')
        const list = await request(app).get(`/events/${eventId}/tickets`)
        const ticket = list.body.find(t => t.status === 'available')

        const res = await request(app)
            .put(`/tickets/${ticket.id}`)
            .set(bearer(adminToken))
            .send({ status: 'sold' })
        expect(res.status).toBe(200)
        expect(res.body.status).toBe('sold')
    })

    it('returns 404 for non-existent ticket', async () => {
        const res = await request(app)
            .put('/tickets/99999')
            .set(bearer(adminToken))
            .send({ status: 'sold' })
        expect(res.status).toBe(404)
    })
})

// ──────────────────────────────────────────────────────────────────────
// DELETE /tickets/:id  (admin)
// ──────────────────────────────────────────────────────────────────────

describe('DELETE /tickets/:id', () => {
    it('deletes a ticket (admin)', async () => {
        const eventId = await getEventIdByTitle('Drake')
        const list = await request(app).get(`/events/${eventId}/tickets`)
        const ticketId = list.body[0].id

        const del = await request(app).delete(`/tickets/${ticketId}`).set(bearer(adminToken))
        expect(del.status).toBe(200)

        const after = await request(app).get(`/tickets/${ticketId}`)
        expect(after.status).toBe(404)
    })

    it('returns 404 for non-existent ticket', async () => {
        const res = await request(app).delete('/tickets/99999').set(bearer(adminToken))
        expect(res.status).toBe(404)
    })
})

// ──────────────────────────────────────────────────────────────────────
// GET /events/:eventId/tickets/stats  (public)
// ──────────────────────────────────────────────────────────────────────

describe('GET /events/:eventId/tickets/stats', () => {
    it('returns counts by status with revenue', async () => {
        const id = await getEventIdByTitle('Drake')
        const res = await request(app).get(`/events/${id}/tickets/stats`)
        expect(res.status).toBe(200)
        expect(res.body).toEqual({
            total: 3,
            available: 2,
            sold: 1,
            reserved: 0,
            revenue: 200
        })
    })

    it('returns zeros for an event with no tickets', async () => {
        const id = await getEventIdByTitle('Blaine')
        const res = await request(app).get(`/events/${id}/tickets/stats`)
        expect(res.status).toBe(200)
        expect(res.body.total).toBe(0)
        expect(res.body.revenue).toBe(0)
    })

    it('returns 404 when event does not exist', async () => {
        const res = await request(app).get('/events/99999/tickets/stats')
        expect(res.status).toBe(404)
    })
})

// ──────────────────────────────────────────────────────────────────────
// GET /tickets/global-stats  (public)
// ──────────────────────────────────────────────────────────────────────

describe('GET /tickets/global-stats', () => {
    it('returns global ticket statistics', async () => {
        const res = await request(app).get('/tickets/global-stats')
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('totalTickets', 6)
        expect(res.body).toHaveProperty('totalSold', 2)
        expect(res.body.totalRevenue).toBe(289)
        expect(res.body).toHaveProperty('mostPopularEventId')
    })
})
