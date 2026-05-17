const { Role, Permission } = require('../model/associations')

/**
 * Full permission catalogue.
 * When adding a new permission, add it here AND assign it to the right roles below.
 */
const PERMISSIONS = [
    'events.create',
    'events.update',
    'events.delete',
    'tickets.create',
    'tickets.update',
    'tickets.delete',
    'users.manage',
    'events.favorite',
    'admin.observations',   // view/clear observation logs
    'admin.logs'            // view action logs
]

/**
 * Role → permission mapping.
 *
 * admin      — full access
 * moderator  — can read admin data and manage events/tickets, but NOT manage users
 * user       — standard registered user; can only favorite events
 */
const ROLES = {
    admin:     PERMISSIONS,
    moderator: [
        'events.create',
        'events.update',
        'tickets.create',
        'tickets.update',
        'events.favorite',
        'admin.observations',
        'admin.logs'
    ],
    user: ['events.favorite']
}

async function seedAuth() {
    // ── Upsert permissions ─────────────────────────────────────────────────────
    // findOrCreate each permission so new ones added to PERMISSIONS are applied
    // to existing DBs without wiping anything.
    const permByName = {}
    for (const name of PERMISSIONS) {
        const [perm] = await Permission.findOrCreate({ where: { name } })
        permByName[name] = perm
    }

    // ── Upsert roles + sync their permission sets ──────────────────────────────
    for (const [roleName, permNames] of Object.entries(ROLES)) {
        const [role, created] = await Role.findOrCreate({ where: { name: roleName } })

        // addPermissions is idempotent — it only inserts junction rows that don't exist.
        // This means permissions are only ever added, never accidentally removed.
        const permsToAssign = permNames.map(n => permByName[n])
        await role.addPermissions(permsToAssign)

        if (created) console.log(`Seeded role: ${roleName}`)
    }

    console.log('Auth seed complete — all roles and permissions are up to date.')
}

module.exports = { seedAuth }
