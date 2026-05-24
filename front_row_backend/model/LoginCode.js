const { Model, DataTypes } = require('sequelize')
const sequelize = require('../db')

class LoginCode extends Model {}

LoginCode.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        // SHA-256 hash of the 6-digit code (never store the raw code)
        codeHash: {
            type: DataTypes.STRING(64),
            allowNull: false
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE'
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        used: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    },
    {
        sequelize,
        modelName: 'LoginCode',
        tableName: 'login_codes',
        timestamps: true
    }
)

module.exports = { LoginCode }
