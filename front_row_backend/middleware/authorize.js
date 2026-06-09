
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' })
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' })
        }
        next()
    }
}


function requirePermission(...requiredPerms) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' })
        }
        const userPerms = req.user.permissions || []
        const missing = requiredPerms.filter(p => !userPerms.includes(p))
        if (missing.length > 0) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                missing
            })
        }
        next()
    }
}

module.exports = { requireRole, requirePermission }
