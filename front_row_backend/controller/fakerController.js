const fakerService = require('../service/fakerService')

class FakerController {
    async start(req, res,next) {
        try{
            const result = await fakerService.startFakerLoop()
            return res.status(200).json(result)
        }catch(err){
            next(err)
        }
    }

    async stop(req, res,next) {
        try{
            const result = await fakerService.stopFakerLoop()
            return res.status(200).json(result)
        }catch(err){
            next(err)
        }
    }

    async status(req, res) {
        return res.status(200).json({ running: fakerService.isRunning() })
    }
}

module.exports = new FakerController()