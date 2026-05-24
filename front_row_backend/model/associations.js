const sequelize     = require('../db')
const { Event }     = require('./Event.js')
const { Ticket }    = require('./Ticket.js')
const { EventDate } = require('./EventDate.js')
const { User }      = require('./User.js')
const { Role }      = require('./Role.js')
const { Permission } = require('./Permission.js')
const { Log }       = require('./Log.js')
const { ObservationList } = require('./ObservationList.js')
const { RefreshToken } = require('./RefreshToken.js')
const { PasswordResetToken } = require('./PasswordResetToken.js')
const { LoginCode } = require('./LoginCode.js')

Event.hasMany(Ticket,    { foreignKey: 'eventId', as: 'tickets' })
Ticket.belongsTo(Event,  { foreignKey: 'eventId', as: 'event'   })

Event.hasMany(EventDate,    { foreignKey: 'eventId', as: 'dates' })
EventDate.belongsTo(Event,  { foreignKey: 'eventId', as: 'event' })

User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' })
Role.hasMany(User,   { foreignKey: 'roleId', as: 'users' })

Role.belongsToMany(Permission, { through: 'role_permissions', as: 'permissions' })
Permission.belongsToMany(Role, { through: 'role_permissions', as: 'roles' })

User.hasMany(Log,                { foreignKey: 'userId', as: 'logs' })
Log.belongsTo(User,              { foreignKey: 'userId', as: 'user' })

User.hasMany(ObservationList,    { foreignKey: 'userId', as: 'observations' })
ObservationList.belongsTo(User,  { foreignKey: 'userId', as: 'user' })

User.hasMany(RefreshToken,       { foreignKey: 'userId', as: 'refreshTokens' })
RefreshToken.belongsTo(User,     { foreignKey: 'userId', as: 'user' })

User.hasMany(PasswordResetToken, { foreignKey: 'userId', as: 'passwordResetTokens' })
PasswordResetToken.belongsTo(User, { foreignKey: 'userId', as: 'user' })

User.hasMany(LoginCode,          { foreignKey: 'userId', as: 'loginCodes' })
LoginCode.belongsTo(User,        { foreignKey: 'userId', as: 'user' })

module.exports = {
    sequelize,
    Event, Ticket, EventDate,
    User, Role, Permission,
    Log, ObservationList,
    RefreshToken, PasswordResetToken,
    LoginCode
}
