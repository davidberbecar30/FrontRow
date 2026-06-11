const express = require('express')
const router  = express.Router()
const adminController = require('../controller/adminController')
const { requireAuth } = require('../middleware/authenticate')
const { requireRole, requirePermission } = require('../middleware/authorize')

// All admin endpoints require a valid login
router.use(requireAuth)

// Read-only admin data: admin and moderator can both view
router.get('/observations',
    requirePermission('admin.observations'),
    adminController.getObservations
)
router.get('/logs',
    requirePermission('admin.logs'),
    adminController.getLogs
)

// Revenue — admin only
router.get('/revenue',
    requireRole('admin'),
    adminController.getRevenue
)

// Check-in — admin only
router.post('/check-in',
    requireRole('admin'),
    adminController.checkIn
)

// Destructive actions: admin only
router.delete('/observations/:id',
    requireRole('admin'),
    adminController.clearObservation
)

module.exports = router
