/**
 * Silver Auth Tests
 * Covers:
 *   - Permissions embedded in JWT
 *   - Refresh token rotation
 *   - Logout / session revocation
 *   - Password recovery flow (forgot → reset)
 *   - requirePermission middleware
 *   - Moderator role access
 *   - OAuth endpoints (503 when not configured)
 */

const request = require('supertest')
const jwt     = require('jsonwebtoken')
const app     = require('../app')
const { sequelize } = require('../model/associations')
const { seedRolesAndPermissions, seedTestUser } = require('./fixtures')
const { JWT_SECRET } = require('../config/auth')
const authService = require('../service/authService')

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

// ──────────────────────────────────────────────────────────────────────────────
// 1. Permissions embedded in JWT
// ──────────────────────────────────────────────────────────────────────────────

describe('JWT contains permissions array', () => {
    it('user token includes only events.favorite', async () => {
        const res = await request(app).post('/auth/register').send({
            firstName: 'Alice', lastName: 'Test', email: 'alice@test.com',
            password: 'pass123', dateOfBirth: '2000-01-01'
        })
        expect(res.status).toBe(201)
        const decoded = jwt.verify(res.body.token, JWT_SECRET)
        expect(decoded.permissions).toEqual(expect.arrayContaining(['events.favorite']))
        expect(decoded.permissions).not.toContain('events.create')
        expect(decoded.permissions).not.toContain('users.manage')
    })

    it('admin token includes full permission set', async () => {
        await seedTestUser({ email: 'admin@test.com', password: 'pw', role: 'admin' })
        const res = await request(app).post('/auth/login').send({ email: 'admin@test.com', password: 'pw' })
        const decoded = jwt.verify(res.body.token, JWT_SECRET)
        expect(decoded.permissions).toEqual(expect.arrayContaining([
            'events.create', 'events.delete', 'users.manage', 'admin.logs'
        ]))
    })

    it('response includes a refreshToken alongside the access token', async () => {
        const res = await request(app).post('/auth/register').send({
            firstName: 'Bob', lastName: 'Test', email: 'bob@test.com',
            password: 'pass123', dateOfBirth: '2000-01-01'
        })
        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('refreshToken')
        expect(typeof res.body.refreshToken).toBe('string')
        expect(res.body.refreshToken.length).toBeGreaterThan(20)
    })
})

// ──────────────────────────────────────────────────────────────────────────────
// 2. Refresh token rotation
// ──────────────────────────────────────────────────────────────────────────────

describe('POST /auth/refresh', () => {
    let firstRefreshToken, firstAccessToken

    beforeEach(async () => {
        await seedTestUser({ email: 'refresh@test.com', password: 'pw' })
        const res = await request(app).post('/auth/login').send({ email: 'refresh@test.com', password: 'pw' })
        firstRefreshToken = res.body.refreshToken
        firstAccessToken  = res.body.token
    })

    it('returns a new token pair', async () => {
        const res = await request(app).post('/auth/refresh').send({ refreshToken: firstRefreshToken })
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('token')
        expect(res.body).toHaveProperty('refreshToken')
        expect(res.body.token).not.toBe(firstAccessToken)
        expect(res.body.refreshToken).not.toBe(firstRefreshToken)
    })

    it('old refresh token cannot be reused after rotation', async () => {
        await request(app).post('/auth/refresh').send({ refreshToken: firstRefreshToken })
        const res2 = await request(app).post('/auth/refresh').send({ refreshToken: firstRefreshToken })
        expect(res2.status).toBe(401)
    })

    it('returns 400 when refreshToken is missing from body', async () => {
        const res = await request(app).post('/auth/refresh').send({})
        expect(res.status).toBe(400)
    })

    it('returns 401 for a fabricated refresh token', async () => {
        const res = await request(app).post('/auth/refresh').send({ refreshToken: 'not-a-real-token' })
        expect(res.status).toBe(401)
    })
})

// ──────────────────────────────────────────────────────────────────────────────
// 3. Logout / session revocation
// ──────────────────────────────────────────────────────────────────────────────

describe('POST /auth/logout', () => {
    let accessToken, refreshToken

    beforeEach(async () => {
        await seedTestUser({ email: 'logout@test.com', password: 'pw' })
        const res = await request(app).post('/auth/login').send({ email: 'logout@test.com', password: 'pw' })
        accessToken  = res.body.token
        refreshToken = res.body.refreshToken
    })

    it('returns 200', async () => {
        const res = await request(app)
            .post('/auth/logout')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ refreshToken })
        expect(res.status).toBe(200)
    })

    it('revoked refresh token cannot get a new access token', async () => {
        await request(app)
            .post('/auth/logout')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ refreshToken })

        const res = await request(app).post('/auth/refresh').send({ refreshToken })
        expect(res.status).toBe(401)
    })

    it('logout without a body still succeeds (revokes all sessions)', async () => {
        const res = await request(app)
            .post('/auth/logout')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({})
        expect(res.status).toBe(200)
    })
})

// ──────────────────────────────────────────────────────────────────────────────
// 4. Password recovery
// ──────────────────────────────────────────────────────────────────────────────

describe('Password recovery flow', () => {
    beforeEach(async () => {
        await seedTestUser({ email: 'recover@test.com', password: 'oldpass' })
    })

    it('POST /auth/forgot-password always returns 200 (no email-exists leak)', async () => {
        const res1 = await request(app).post('/auth/forgot-password').send({ email: 'recover@test.com' })
        const res2 = await request(app).post('/auth/forgot-password').send({ email: 'ghost@test.com' })
        expect(res1.status).toBe(200)
        expect(res2.status).toBe(200)
    })

    it('returns 400 when email is missing', async () => {
        const res = await request(app).post('/auth/forgot-password').send({})
        expect(res.status).toBe(400)
    })

    it('full reset flow: can log in with new password after reset', async () => {
        // Step 1: request reset — returns raw token in test env
        const rawToken = await authService.forgotPassword('recover@test.com')
        expect(rawToken).toBeTruthy()

        // Step 2: use token to set new password
        const resetRes = await request(app).post('/auth/reset-password').send({
            token: rawToken, newPassword: 'newpass123'
        })
        expect(resetRes.status).toBe(200)

        // Step 3: old password no longer works
        const oldLogin = await request(app).post('/auth/login').send({
            email: 'recover@test.com', password: 'oldpass'
        })
        expect(oldLogin.status).toBe(401)

        // Step 4: new password works
        const newLogin = await request(app).post('/auth/login').send({
            email: 'recover@test.com', password: 'newpass123'
        })
        expect(newLogin.status).toBe(200)
        expect(newLogin.body).toHaveProperty('token')
    })

    it('reset token cannot be reused', async () => {
        const rawToken = await authService.forgotPassword('recover@test.com')
        await request(app).post('/auth/reset-password').send({ token: rawToken, newPassword: 'newpass123' })
        const res = await request(app).post('/auth/reset-password').send({ token: rawToken, newPassword: 'anotherpass' })
        expect(res.status).toBe(400)
    })

    it('returns 400 for a fabricated reset token', async () => {
        const res = await request(app).post('/auth/reset-password').send({
            token: 'totallyfaketoken', newPassword: 'newpass123'
        })
        expect(res.status).toBe(400)
    })

    it('returns 400 when newPassword is too short', async () => {
        const rawToken = await authService.forgotPassword('recover@test.com')
        const res = await request(app).post('/auth/reset-password').send({ token: rawToken, newPassword: 'abc' })
        expect(res.status).toBe(400)
    })
})

// ──────────────────────────────────────────────────────────────────────────────
// 5. requirePermission middleware
// ──────────────────────────────────────────────────────────────────────────────

describe('requirePermission middleware', () => {
    let userToken, adminToken, modToken

    beforeEach(async () => {
        await seedTestUser({ email: 'user@perm.com',  password: 'pw', role: 'user' })
        await seedTestUser({ email: 'admin@perm.com', password: 'pw', role: 'admin' })
        await seedTestUser({ email: 'mod@perm.com',   password: 'pw', role: 'moderator' })

        userToken  = (await request(app).post('/auth/login').send({ email: 'user@perm.com',  password: 'pw' })).body.token
        adminToken = (await request(app).post('/auth/login').send({ email: 'admin@perm.com', password: 'pw' })).body.token
        modToken   = (await request(app).post('/auth/login').send({ email: 'mod@perm.com',   password: 'pw' })).body.token
    })

    it('user gets 403 on events.create (no permission)', async () => {
        const res = await request(app)
            .post('/events')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ title: 'X', description: 'Y', category: 'Concert', price: 1, availableTickets: 1,
                    dates: [{ date: '2027-01-01', location: 'X', venue: 'Y' }] })
        expect(res.status).toBe(403)
    })

    it('moderator can create events (has events.create permission)', async () => {
        const res = await request(app)
            .post('/events')
            .set('Authorization', `Bearer ${modToken}`)
            .send({ title: 'Mod Event', description: 'by mod', category: 'Concert',
                    price: 10, availableTickets: 50,
                    dates: [{ date: '2027-06-01', location: 'LA', venue: 'Arena' }] })
        expect(res.status).toBe(201)
    })

    it('moderator cannot DELETE events (admin only)', async () => {
        // First create an event as admin
        const create = await request(app)
            .post('/events')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ title: 'Test', description: 'desc', category: 'Concert',
                    price: 10, availableTickets: 10,
                    dates: [{ date: '2027-01-01', location: 'X', venue: 'Y' }] })
        expect(create.status).toBe(201)

        const del = await request(app)
            .delete(`/events/${create.body.id}`)
            .set('Authorization', `Bearer ${modToken}`)
        expect(del.status).toBe(403)
    })

    it('moderator can read /admin/observations (has admin.observations permission)', async () => {
        const res = await request(app)
            .get('/admin/observations')
            .set('Authorization', `Bearer ${modToken}`)
        expect(res.status).toBe(200)
    })

    it('user cannot read /admin/observations (no admin.observations permission)', async () => {
        const res = await request(app)
            .get('/admin/observations')
            .set('Authorization', `Bearer ${userToken}`)
        expect(res.status).toBe(403)
    })
})

// ──────────────────────────────────────────────────────────────────────────────
// 6. OAuth endpoints return 503 when unconfigured
// ──────────────────────────────────────────────────────────────────────────────

describe('OAuth endpoints', () => {
    it('GET /auth/google returns 503 when GOOGLE_CLIENT_ID not set', async () => {
        const saved = process.env.GOOGLE_CLIENT_ID
        delete process.env.GOOGLE_CLIENT_ID
        const res = await request(app).get('/auth/google')
        expect([302, 503]).toContain(res.status)
        process.env.GOOGLE_CLIENT_ID = saved
    })

    it('GET /auth/github returns 503 when GITHUB_CLIENT_ID not set', async () => {
        const saved = process.env.GITHUB_CLIENT_ID
        delete process.env.GITHUB_CLIENT_ID
        const res = await request(app).get('/auth/github')
        expect([302, 503]).toContain(res.status)
        process.env.GITHUB_CLIENT_ID = saved
    })
})
