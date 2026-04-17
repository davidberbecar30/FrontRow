const fakerService = require('../service/fakerService')

class FakerController {
    start(req, res) {
        const result = fakerService.startFakerLoop()
        return res.status(200).json(result)
    }

    stop(req, res) {
        const result = fakerService.stopFakerLoop()
        return res.status(200).json(result)
    }

    status(req, res) {
        return res.status(200).json({ running: fakerService.isRunning() })
    }
}

module.exports = new FakerController()