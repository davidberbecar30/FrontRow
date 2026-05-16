function extractUser(req, res, next) {
    const userIdHeader = req.headers['x-user-id']
    const roleHeader   = req.headers['x-user-role']

    if (userIdHeader) {
        const id = Number(userIdHeader)
        if (!Number.isNaN(id) && id > 0) {
            req.user = { id, role: roleHeader || 'user' }
        }
    }

    next()
}

module.exports = extractUser
