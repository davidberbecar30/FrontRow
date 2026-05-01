const { Role, Permission } = require('../model/associations')

const PERMISSIONS = [
    'events.create',
    'events.update',
    'events.delete',
    'tickets.create',
    'tickets.update',
    'tickets.delete',
    'users.manage',
    'events.favorite'
]

const ROLES = {
    admin: PERMISSIONS,                      
    user:  ['events.favorite']
}

async function seedAuth() {
    const existing = await Role.findOne({ where: { name: 'user' } })
    if (existing) return

    
    const permRecords = await Permission.bulkCreate(
        PERMISSIONS.map(name => ({ name }))
    )
    const permByName = Object.fromEntries(permRecords.map(p => [p.name, p]))

    
    for (const [roleName, permNames] of Object.entries(ROLES)) {
        const role = await Role.create({ name: roleName })
        await role.setPermissions(permNames.map(n => permByName[n]))
    }

    console.log('Seeded auth: roles + permissions')
}

module.exports = { seedAuth }
