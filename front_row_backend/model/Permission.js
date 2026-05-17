const{Model,DataTypes}=require("sequelize")
const sequelize=require("../db")

class Permission extends Model {}

Permission.init(
    {
        id:{
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true,
        },
        name:{
            type:DataTypes.STRING,
            allowNull:false,
            unique:true
        },
    },
    {
        sequelize,
        modelName:"Permission",
        tableName:"permissions",
        timestamps:true
    }
)

module.exports={Permission}