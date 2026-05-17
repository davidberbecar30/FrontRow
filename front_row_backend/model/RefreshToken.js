const { Model, DataTypes } = require('sequelize')
const sequelize = require('../db')

class RefreshToken extends Model {}

RefreshToken.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        // Store the SHA-256 hash of the token — never the raw value
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
        revoked: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    },
    {
        sequelize,
        modelName: 'RefreshToken',
        tableName: 'refresh_tokens',
        timestamps: true
    }
)

module.exports = { RefreshToken }
