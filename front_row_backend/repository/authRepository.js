const { User, Role, Permission, RefreshToken, PasswordResetToken, LoginCode } = require('../model/associations')
const { Op } = require('sequelize')

const withRoleAndPermissions = {
    include: [{
        association: 'role',
        include: [{ association: 'permissions' }]
    }]
}

class AuthRepository {

    constructor() {}

    // ── Users ────────────────────────────────────────────────────────

    async findUserByEmail(email) {
        return User.findOne({
            where: { email },
            ...withRoleAndPermissions
        })
    }

    async findUserById(userId) {
        return User.findByPk(userId, withRoleAndPermissions)
    }

    async createUser(userData) {
        return User.create(userData)
    }

    async updateUserPassword(userId, hashedPassword) {
        return User.update({ password: hashedPassword }, { where: { id: userId } })
    }

    async findAllUsers() {
        return User.findAll({
            attributes: { exclude: ['password'] },
            include: [{ association: 'role' }],
            order: [['id', 'ASC']]
        })
    }

    // ── Roles & Permissions ──────────────────────────────────────────

    async findRoleByName(name) {
        return Role.findOne({ where: { name } })
    }

    async findRoleById(id) {
        return Role.findByPk(id, {
            include: [{ association: 'permissions' }]
        })
    }

    // ── Refresh Tokens ───────────────────────────────────────────────

    async createRefreshToken({ userId, tokenHash, expiresAt }) {
        return RefreshToken.create({ userId, tokenHash, expiresAt })
    }

    async findRefreshToken(tokenHash) {
        return RefreshToken.findOne({
            where: {
                tokenHash,
                revoked:   false,
                expiresAt: { [Op.gt]: new Date() }
            }
        })
    }

    async revokeRefreshToken(tokenHash) {
        return RefreshToken.update({ revoked: true }, { where: { tokenHash } })
    }

    async revokeAllUserRefreshTokens(userId) {
        return RefreshToken.update({ revoked: true }, { where: { userId, revoked: false } })
    }

    // ── Password Reset Tokens ────────────────────────────────────────

    async createPasswordResetToken({ userId, tokenHash, expiresAt }) {
        // Invalidate any prior unused tokens for this user before creating a new one
        await PasswordResetToken.update(
            { used: true },
            { where: { userId, used: false } }
        )
        return PasswordResetToken.create({ userId, tokenHash, expiresAt })
    }

    async findPasswordResetToken(tokenHash) {
        return PasswordResetToken.findOne({
            where: {
                tokenHash,
                used:      false,
                expiresAt: { [Op.gt]: new Date() }
            }
        })
    }

    async markResetTokenUsed(tokenHash) {
        return PasswordResetToken.update({ used: true }, { where: { tokenHash } })
    }

    // ── 2FA Login Codes ──────────────────────────────────────────────

    async createLoginCode({ userId, codeHash, expiresAt }) {
        // Invalidate any prior unused codes for this user
        await LoginCode.update(
            { used: true },
            { where: { userId, used: false } }
        )
        return LoginCode.create({ userId, codeHash, expiresAt })
    }

    async findValidLoginCode(codeHash) {
        return LoginCode.findOne({
            where: {
                codeHash,
                used:      false,
                expiresAt: { [Op.gt]: new Date() }
            }
        })
    }

    async markLoginCodeUsed(codeHash) {
        return LoginCode.update({ used: true }, { where: { codeHash } })
    }
}

module.exports = new AuthRepository()
