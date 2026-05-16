const express = require('express')
const router = express.Router()
const adminController = require('../controller/adminController')
const { requireAuth } = require('../middleware/authenticate')
const { requireRole } = require('../middleware/authorize')

// All admin endpoints require an authenticated admin
router.use(requireAuth, requireRole('admin'))

router.get('/observations',         adminController.getObservations)
router.get('/logs',                 adminController.getLogs)
router.delete('/observations/:id',  adminController.clearObservation)

module.exports = router
