const {Model, DataTypes}=require("sequelize")
const sequelize=require("../db")
class User extends Model{}

User.init(
    {
        id:{
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true
        },
        firstName:{
            type:DataTypes.STRING,
            allowNull:false
        },
        lastName:{
            type:DataTypes.STRING,
            allowNull:false
        },
        email:{
            type:DataTypes.STRING,
            unique:true,
            allowNull:false
        },
        password:{
            type:DataTypes.STRING,
            allowNull:false
        },
        dateOfBirth:{
            type:DataTypes.DATEONLY,
            allowNull:false
        },
        roleId:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references:{model:"roles",key:"id"},
            onDelete:"RESTRICT",
            onUpdate:"CASCADE",
        },
    },
    {
        sequelize,
        modelName:"User",
        tableName:"users",
        timestamps:true
    }
)

module.exports={User}