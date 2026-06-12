const { Model, DataTypes } = require('sequelize')
const sequelize = require('../db')

class PrizeDraw extends Model {}

PrizeDraw.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        eventId: {
            type: DataTypes.INTEGER, allowNull: false,
            references: { model: 'events', key: 'id' }, onDelete: 'CASCADE'
        },
        eventDateId: {
            type: DataTypes.INTEGER, allowNull: false,
            references: { model: 'event_dates', key: 'id' }, onDelete: 'CASCADE'
        },
        prizeDescription: { type: DataTypes.STRING, allowNull: false },
        durationHours:    { type: DataTypes.FLOAT,   allowNull: false },
        startedAt:        { type: DataTypes.DATE,    allowNull: false },
        endsAt:           { type: DataTypes.DATE,    allowNull: false },
        status: {
            type: DataTypes.ENUM('active', 'completed', 'cancelled'),
            allowNull: false, defaultValue: 'active'
        },
        winnerId: {
            type: DataTypes.INTEGER, allowNull: true,
            references: { model: 'users', key: 'id' }, onDelete: 'SET NULL'
        },
        createdBy: {
            type: DataTypes.INTEGER, allowNull: false,
            references: { model: 'users', key: 'id' }, onDelete: 'SET NULL'
        }
    },
    {
        sequelize,
        modelName: 'PrizeDraw',
        tableName: 'prize_draws',
        timestamps: true
    }
)

module.exports = { PrizeDraw }
