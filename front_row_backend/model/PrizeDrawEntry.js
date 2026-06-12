const { Model, DataTypes } = require('sequelize')
const sequelize = require('../db')

class PrizeDrawEntry extends Model {}

PrizeDrawEntry.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        drawId: {
            type: DataTypes.INTEGER, allowNull: false,
            references: { model: 'prize_draws', key: 'id' }, onDelete: 'CASCADE'
        },
        userId: {
            type: DataTypes.INTEGER, allowNull: false,
            references: { model: 'users', key: 'id' }, onDelete: 'CASCADE'
        }
    },
    {
        sequelize,
        modelName: 'PrizeDrawEntry',
        tableName: 'prize_draw_entries',
        timestamps: true,
        indexes: [{ unique: true, fields: ['drawId', 'userId'] }]
    }
)

module.exports = { PrizeDrawEntry }
