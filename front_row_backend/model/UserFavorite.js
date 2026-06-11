const { Model, DataTypes } = require('sequelize')
const sequelize = require('../db')

class UserFavorite extends Model {}

UserFavorite.init(
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
        }
    },
    {
        sequelize,
        modelName: 'UserFavorite',
        tableName: 'user_favorites',
        timestamps: true,
        indexes: [
            { unique: true, fields: ['userId', 'eventId'] }
        ]
    }
)

module.exports = { UserFavorite }
