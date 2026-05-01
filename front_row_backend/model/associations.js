const sequelize     = require('../db')
const { Event }     = require('./Event.js')
const { Ticket }    = require('./Ticket.js')
const { EventDate } = require('./EventDate.js')
const {User}=require("./User.js")
const {Role}=require("./Role.js")
const {Permission}=require("./Permission.js")

Event.hasMany(Ticket,    { foreignKey: 'eventId', as: 'tickets' })
Ticket.belongsTo(Event,  { foreignKey: 'eventId', as: 'event'   })

Event.hasMany(EventDate,    { foreignKey: 'eventId', as: 'dates' })
EventDate.belongsTo(Event,  { foreignKey: 'eventId', as: 'event' })

User.belongsTo(Role,{foreignKey:"roleId", as:"role"})
Role.hasMany(User,{foreignKey:"roleId",as:"users"})

Role.belongsToMany(Permission, { through: 'role_permissions', as: 'permissions' })
Permission.belongsToMany(Role, { through: 'role_permissions', as: 'roles' })


module.exports = { sequelize, Event, Ticket, EventDate, User,Role,Permission }