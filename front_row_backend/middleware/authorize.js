// Role-based and permission-based authorization. Use after requireAuth.
// Example: router.delete('/:id', requireAuth, requireRole('admin'), controller.deleteEvent)
// Example: router.patch('/fav', requireAuth, requirePermission('events.favorite'), controller.toggleFavorite)

/**
 * requireRole(...roles)
 * Passes if req.user.role matches any of the given role names.
 */
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

/**
 * requirePermission(...permissions)
 * Passes if req.user.permissions includes ALL of the given permission names.
 * Permissions are embedded in the JWT at login time so no DB round-trip is needed.
 */
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
