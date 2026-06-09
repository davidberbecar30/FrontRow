const { Model, DataTypes } = require('sequelize')
const sequelize = require('../db')

class UserTicket extends Model {}

UserTicket.init(
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
        purchaseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'purchases', key: 'id' },
            onDelete: 'CASCADE'
        }
    },
    {
        sequelize,
        modelName: 'UserTicket',
        tableName: 'user_tickets',
        timestamps: true
    }
)

module.exports = { UserTicket }
