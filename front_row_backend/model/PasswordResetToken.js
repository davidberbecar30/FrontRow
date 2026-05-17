const { Model, DataTypes } = require('sequelize')
const sequelize = require('../db')

class PasswordResetToken extends Model {}

PasswordResetToken.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        // Store the SHA-256 hash of the one-time token
        tokenHash: {
            type: DataTypes.STRING(64),
            allowNull: false,
            unique: true
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
        modelName: 'PasswordResetToken',
        tableName: 'password_reset_tokens',
        timestamps: true
    }
)

module.exports = { PasswordResetToken }
