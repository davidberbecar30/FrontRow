// Bronze auth tests — register/login flow and protected-endpoint enforcement.
// Runs in-band with the other test suites against frontrowdb_test.

const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../app')
const { sequelize, User } = require('../model/associations')
const { seedRolesAndPermissions, seedTestUser } = require('./fixtures')
const { JWT_SECRET } = require('../config/auth')

beforeAll(async () => {
    await sequelize.sync({ force: true })
})

beforeEach(async () => {
    await sequelize.sync({ force: true })
    await seedRolesAndPermissions()
})

afterAll(async () => {
    await sequelize.close()
})

// ──────────────────────────────────────────────────────────────────────
// POST /auth/register
// ──────────────────────────────────────────────────────────────────────

describe('POST /auth/register', () => {
    const validBody = {
        firstName: 'Alice',
        lastName:  'Smith',
        email:     'alice@example.com',
        password:  'hunter22',
        dateOfBirth: '1995-06-15'
    }

    it('creates a user and returns user + JWT', async () => {
        const res = await request(app).post('/auth/register').send(validBody)
        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('user')
        expect(res.body).toHaveProperty('token')
        expect(res.body.user.email).toBe('alice@example.com')
        expect(res.body.user).not.toHaveProperty('password')
        expect(res.body.user.role.name).toBe('user')
    })

    it('returns a token that decodes to the user id and role', async () => {
        const res = await request(app).post('/auth/register').send(validBody)
        const decoded = jwt.verify(res.body.token, JWT_SECRET)
        expect(decoded.id).toBe(res.body.user.id)
        expect(decoded.role).toBe('user')
        expect(decoded.email).toBe('alice@example.com')
    })

    it('hashes the password (not stored in plaintext)', async () => {
        await request(app).post('/auth/register').send(validBody)
        const dbUser = await User.findOne({ where: { email: 'alice@example.com' } })
        expect(dbUser.password).not.toBe('hunter22')
        expect(dbUser.password.startsWith('$2')).toBe(true)   // bcrypt hash prefix
    })

    it('rejects duplicate email with 409', async () => {
        await request(app).post('/auth/register').send(validBody)
        const res = await request(app).post('/auth/register').send(validBody)
        expect(res.status).toBe(409)
    })

    it('rejects missing fields with 400', async () => {
        const { password, ...rest } = validBody
        const res = await request(app).post('/auth/register').send(rest)
        expect(res.status).toBe(400)
    })
})

// ──────────────────────────────────────────────────────────────────────
// POST /auth/login
// ──────────────────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
    beforeEach(async () => {
        await seedTestUser({ email: 'bob@example.com', password: 'mypassword' })
    })

    it('returns user + JWT for valid credentials', async () => {
        const res = await request(app).post('/auth/login').send({
            email: 'bob@example.com',
            password: 'mypassword'
        })
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('token')
        expect(res.body.user.email).toBe('bob@example.com')
        expect(res.body.user).not.toHaveProperty('password')
    })

    it('returns 401 for wrong password', async () => {
        const res = await request(app).post('/auth/login').send({
            email: 'bob@example.com',
            password: 'WRONG'
        })
        expect(res.status).toBe(401)
        expect(res.body).not.toHaveProperty('token')
    })

    it('returns 401 (same message) for non-existent user — no enumeration leak', async () => {
        const res = await request(app).post('/auth/login').send({
            email: 'ghost@example.com',
            password: 'anything'
        })
        expect(res.status).toBe(401)
    })

    it('returns 400 when email or password missing', async () => {
        const res = await request(app).post('/auth/login').send({ email: 'bob@example.com' })
        expect(res.status).toBe(400)
    })
})

// ──────────────────────────────────────────────────────────────────────
// Protected endpoints — token verification
// ──────────────────────────────────────────────────────────────────────

describe('Protected endpoints', () => {
    let userToken
    let adminToken

    beforeEach(async () => {
        await seedTestUser({ email: 'user@x.com', password: 'pw' })
        await seedTestUser({ email: 'admin@x.com', password: 'pw', role: 'admin' })

        const userRes  = await request(app).post('/auth/login').send({ email: 'user@x.com',  password: 'pw' })
        const adminRes = await request(app).post('/auth/login').send({ email: 'admin@x.com', password: 'pw' })
        userToken  = userRes.body.token
        adminToken = adminRes.body.token
    })

    it('POST /events without a token returns 401', async () => {
        const res = await request(app)
            .post('/events')
            .send({ title: 'X', category: 'Concert', price: 1, availableTickets: 1,
                    dates: [{ date: '2027-01-01', location: 'X', venue: 'Y' }] })
        expect(res.status).toBe(401)
    })

    it('POST /events with a tampered token returns 401', async () => {
        const res = await request(app)
            .post('/events')
            .set('Authorization', 'Bearer not-a-real-token')
            .send({})
        expect(res.status).toBe(401)
    })

    it('POST /events with a user (non-admin) token returns 403', async () => {
        const res = await request(app)
            .post('/events')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                title: 'X', description: 'Y', category: 'Concert', price: 1, availableTickets: 1,
                dates: [{ date: '2027-01-01', location: 'X', venue: 'Y' }]
            })
        expect(res.status).toBe(403)
    })

    it('POST /events with an admin token succeeds', async () => {
        const res = await request(app)
            .post('/events')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: 'Admin Concert',
                description: 'Created by admin',
                category: 'Concert',
                price: 50,
                availableTickets: 100,
                dates: [{ date: '2027-01-01', location: 'X', venue: 'Y' }]
            })
        expect(res.status).toBe(201)
        expect(res.body.title).toBe('Admin Concert')
    })

    it('GET /admin/observations requires admin (403 for user)', async () => {
        const res = await request(app)
            .get('/admin/observations')
            .set('Authorization', `Bearer ${userToken}`)
        expect(res.status).toBe(403)
    })

    it('GET /admin/observations allowed for admin', async () => {
        const res = await request(app)
            .get('/admin/observations')
            .set('Authorization', `Bearer ${adminToken}`)
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body)).toBe(true)
    })

    it('authenticated requests get a refreshed token via X-New-Token header', async () => {
        const res = await request(app)
            .get('/auth/me')
            .set('Authorization', `Bearer ${userToken}`)
        expect(res.status).toBe(200)
        expect(res.headers['x-new-token']).toBeDefined()
        expect(res.headers['x-new-token']).not.toBe(userToken)   // it's a fresh signature
    })

    it('GET /events stays public (no token required)', async () => {
        const res = await request(app).get('/events')
        expect(res.status).toBe(200)
    })
})
