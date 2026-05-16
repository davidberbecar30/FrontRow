const { Log, User } = require('../model/associations')

class LogRepository {
    constructor() {}

    async findRecent(limit = 100) {
        return Log.findAll({
            include: [{
                association: 'user',
                attributes: ['id', 'firstName', 'lastName', 'email']
            }],
            order: [['createdAt', 'DESC']],
            limit
        })
    }

    async findByUser(userId, limit = 100) {
        return Log.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit
        })
    }
}

module.exports = new LogRepository()
