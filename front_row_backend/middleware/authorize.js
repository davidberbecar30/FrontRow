// Role-based authorization. Use after requireAuth.
// Example: router.delete('/:id', requireAuth, requireRole('admin'), controller.deleteEvent)

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

module.exports = { requireRole }
