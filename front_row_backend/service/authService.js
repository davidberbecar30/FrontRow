const authRepo=require("../repository/authRepository")
const bcrypt=require("bcrypt")

const DEFAULT_ROLE="user"

class AuthService{

    constructor(){

    }

    async register(userInput){

        const existingEmail=await authRepo.findUserByEmail(userInput.email)
        if(existingEmail){
            const err = new Error('Email already registered')
            err.status = 409
            throw err
        }

        const defaultRole=await authRepo.findRoleByName(DEFAULT_ROLE)
        if(!defaultRole){
            const err = new Error(`Default role "${DEFAULT_ROLE}" missing — seed it first`)
            err.status = 500
            throw err
        }

        const hashedPassword=await bcrypt.hash(userInput.password,10)

        const userData = {
            firstName:   userInput.firstName,
            lastName:    userInput.lastName,
            email:       userInput.email,
            dateOfBirth: userInput.dateOfBirth,
            password:    hashedPassword,
            roleId:      defaultRole.id
        }

        const created = await authRepo.createUser(userData)

        const fullUser = await authRepo.findUserById(created.id)

        return this._sanitize(fullUser)
    }

    async login(email,password){
        const existingUser=await authRepo.findUserByEmail(email)
        if(!existingUser) return null

        const match=await bcrypt.compare(password,existingUser.password)
        if(!match) return null

        return this._sanitize(existingUser)
    }

    async getCurrentUser(id) {
        const user = await authRepo.findUserById(id)
        if (!user) return null
        return this._sanitize(user)
    }

    _sanitize(userInstance){
        const plain = userInstance.get({ plain: true })
        delete plain.password
        return plain
    }

}

module.exports=new AuthService()