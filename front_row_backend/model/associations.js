const sequelize     = require('../db')
const { Event }     = require('./Event.js')
const { Ticket }    = require('./Ticket.js')
const { EventDate } = require('./EventDate.js')

Event.hasMany(Ticket,    { foreignKey: 'eventId', as: 'tickets' })
Ticket.belongsTo(Event,  { foreignKey: 'eventId', as: 'event'   })

Event.hasMany(EventDate,    { foreignKey: 'eventId', as: 'dates' })
EventDate.belongsTo(Event,  { foreignKey: 'eventId', as: 'event' })

module.exports = { sequelize, Event, Ticket, EventDate }