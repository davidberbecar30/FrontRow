const controller = require("../controller/controller")
const express = require("express")
const router = express.Router()
const { eventValidationRules, validate } = require("../validation/eventValidation")

router.get("/", controller.getAllEvents)
router.get("/statistics", controller.getStatistics)
router.get("/:id", controller.getEventById)
router.post("/", eventValidationRules, validate, controller.addEvent)
router.put("/:id", eventValidationRules, validate, controller.updateEvent)
router.delete("/:id", controller.deleteEvent)
router.patch("/:id/favorite", controller.toggleFavorite)

module.exports = router