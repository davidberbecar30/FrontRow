const express = require('express')
const router = express.Router()
const adminController = require('../controller/adminController')

router.get('/observations',         adminController.getObservations)
router.get('/logs',                 adminController.getLogs)
router.delete('/observations/:id',  adminController.clearObservation)

module.exports = router
