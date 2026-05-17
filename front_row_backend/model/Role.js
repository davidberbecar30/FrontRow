const {Model,DataTypes}=require("sequelize")
const sequelize = require("../db")

class Role extends Model{}

Role.init(
    {
        id:{
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    },
    {
        sequelize,
        modelName:"Role",
        tableName:'roles',
        timestamps:true
    }
)

module.exports={Role}