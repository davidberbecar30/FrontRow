const { Model, DataTypes } = require('sequelize')
const sequelize = require('../db')

class ObservationList extends Model {}

ObservationList.init(
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
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        reason: {
            type: DataTypes.STRING(500),
            allowNull: false
        }
    },
    {
        sequelize,
        modelName: 'ObservationList',
        tableName: 'observation_list',
        timestamps: true   // createdAt = when flagged
    }
)

module.exports = { ObservationList }
