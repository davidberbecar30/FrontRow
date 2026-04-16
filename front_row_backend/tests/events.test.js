const request = require('supertest')
const app = require('../app')

describe('GET /events', () => {
    it('should return paginated events', async () => {
        const res = await request(app).get('/events')
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('data')
        expect(res.body).toHaveProperty('pagination')
        expect(res.body.data).toBeInstanceOf(Array)
    })

    it('should paginate correctly', async () => {
        const res = await request(app).get('/events?page=1&limit=2')
        expect(res.status).toBe(200)
        expect(res.body.data.length).toBe(2)
        expect(res.body.pagination.currentPage).toBe(1)
        expect(res.body.pagination.limit).toBe(2)
    })

    it('should filter by category', async () => {
        const res = await request(app).get('/events?category=Concert')
        expect(res.status).toBe(200)
        res.body.data.forEach(e => expect(e.category).toBe('Concert'))
    })

    it('should filter by search', async () => {
        const res = await request(app).get('/events?search=Drake')
        expect(res.status).toBe(200)
        res.body.data.forEach(e => expect(e.title).toMatch(/Drake/i))
    })
})

describe('GET /events/statistics', () => {
    it('should return statistics', async () => {
        const res = await request(app).get('/events/statistics')
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('totalEvents')
        expect(res.body).toHaveProperty('categoryBreakdown')
        expect(res.body).toHaveProperty('trending')
        expect(res.body).toHaveProperty('ticketsAvailability')
    })
})

describe('GET /events/:id', () => {
    it('should return event by id', async () => {
        const res = await request(app).get('/events/1')
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('id', 1)
    })

    it('should return 404 for non-existent id', async () => {
        const res = await request(app).get('/events/9999')
        expect(res.status).toBe(404)
        expect(res.body).toHaveProperty('message')
    })
})

describe('POST /events', () => {
    it('should add a new event', async () => {
        const res = await request(app)
            .post('/events')
            .send({
                title: 'Test Concert',
                description: 'A great show',
                category: 'Concert',
                price: 99,
                availableTickets: 200,
                dates: [{ date: '2026-08-08', location: 'London, UK', venue: 'Wembley Stadium' }]
            })
        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('id')
        expect(res.body.title).toBe('Test Concert')
    })

    it('should return 400 for missing title', async () => {
        const res = await request(app)
            .post('/events')
            .send({
                description: 'A great show',
                category: 'Concert',
                price: 99,
                availableTickets: 200,
                dates: [{ date: '2026-08-08', location: 'London, UK', venue: 'Wembley Stadium' }]
            })
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('errors')
    })

    it('should return 400 for invalid price', async () => {
        const res = await request(app)
            .post('/events')
            .send({
                title: 'Test Concert',
                description: 'A great show',
                category: 'Concert',
                price: -10,
                availableTickets: 200,
                dates: [{ date: '2026-08-08', location: 'London, UK', venue: 'Wembley Stadium' }]
            })
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('errors')
    })

    it('should return 400 for invalid date format', async () => {
        const res = await request(app)
            .post('/events')
            .send({
                title: 'Test Concert',
                description: 'A great show',
                category: 'Concert',
                price: 99,
                availableTickets: 200,
                dates: [{ date: 'bad-date', location: 'London, UK', venue: 'Wembley Stadium' }]
            })
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('errors')
    })

    it('should return 400 for empty dates array', async () => {
        const res = await request(app)
            .post('/events')
            .send({
                title: 'Test Concert',
                description: 'A great show',
                category: 'Concert',
                price: 99,
                availableTickets: 200,
                dates: []
            })
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('errors')
    })
})

describe('PUT /events/:id', () => {
    it('should update an existing event', async () => {
        const res = await request(app)
            .put('/events/1')
            .send({
                title: 'Drake Tour Updated',
                description: 'Updated description',
                category: 'Concert',
                price: 150,
                availableTickets: 180,
                dates: [{ date: '2026-08-08', location: 'London, UK', venue: 'Wembley Stadium' }]
            })
        expect(res.status).toBe(200)
        expect(res.body.title).toBe('Drake Tour Updated')
    })

    it('should return 404 for non-existent id', async () => {
        const res = await request(app)
            .put('/events/9999')
            .send({
                title: 'Drake Tour Updated',
                description: 'Updated description',
                category: 'Concert',
                price: 150,
                availableTickets: 180,
                dates: [{ date: '2026-08-08', location: 'London, UK', venue: 'Wembley Stadium' }]
            })
        expect(res.status).toBe(404)
    })
})

describe('DELETE /events/:id', () => {
    it('should delete an existing event', async () => {
        const added = await request(app)
            .post('/events')
            .send({
                title: 'To Delete',
                description: 'Will be deleted',
                category: 'Concert',
                price: 50,
                availableTickets: 100,
                dates: [{ date: '2026-08-08', location: 'London, UK', venue: 'Wembley Stadium' }]
            })
        const id = added.body.id
        const res = await request(app).delete(`/events/${id}`)
        expect(res.status).toBe(200)
    })

    it('should return 404 for non-existent id', async () => {
        const res = await request(app).delete('/events/9999')
        expect(res.status).toBe(404)
    })
})

describe('PATCH /events/:id/favorite', () => {
    it('should toggle favorite', async () => {
        const before = await request(app).get('/events/1')
        const originalFavorited = before.body.favorited
        const res = await request(app).patch('/events/1/favorite')
        expect(res.status).toBe(200)
        expect(res.body.favorited).toBe(!originalFavorited)
    })

    it('should return 404 for non-existent id', async () => {
        const res = await request(app).patch('/events/9999/favorite')
        expect(res.status).toBe(404)
    })
})

describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
        const res = await request(app).get('/unknown')
        expect(res.status).toBe(404)
    })
})