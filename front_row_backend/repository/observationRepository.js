const { ObservationList, User } = require('../model/associations')

class ObservationRepository {
    constructor() {}

    async findAll() {
        return ObservationList.findAll({
            include: [{
                association: 'user',
                attributes: ['id', 'firstName', 'lastName', 'email']
            }],
            order: [['createdAt', 'DESC']]
        })
    }

    async deleteById(id) {
        const row = await ObservationList.findByPk(id)
        if (!row) return null
        await row.destroy()
        return row
    }

    async deleteAllForUser(userId) {
        return ObservationList.destroy({ where: { userId } })
    }
}

module.exports = new ObservationRepository()
