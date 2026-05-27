const { Model, DataTypes } = require('sequelize')
const sequelize = require('../db')

class Purchase extends Model {}

Purchase.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE'
        },
        eventId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'events', key: 'id' },
            onDelete: 'CASCADE'
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1 }
        },
        unitPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        }
    },
    {
        sequelize,
        modelName: 'Purchase',
        tableName: 'purchases',
        timestamps: true
    }
)

module.exports = { Purchase }
