const {User,Role,Permission}=require("../model/associations")

const withRoleAndPermissions = {
    include: [{
        association: 'role',
        include: [{ association: 'permissions' }]
    }]
}

class AuthRepository{

    constructor() {}

    async findUserByEmail(email){
        return User.findOne({
            where:{email},
            ...withRoleAndPermissions
        })
    }

    async findUserById(userId){
        return User.findByPk(userId, withRoleAndPermissions)
    }

    async createUser(userData){
        return User.create(userData)
    }


    async findAllUsers() {
        return User.findAll({
            attributes: { exclude: ['password'] },
            include: [{ association: 'role' }],
            order: [['id', 'ASC']]
        })
    }


    async findRoleByName(name) {
        return Role.findOne({ where: { name } })
    }

    async findRoleById(id) {
        return Role.findByPk(id, {
            include: [{ association: 'permissions' }]
        })
    }

}

module.exports=new AuthRepository()