const {Model,DataTypes}=require('sequelize')
const sequelize=require('../db')

class EventDate extends Model{}

EventDate.init(
    {
        id:{
            type:DataTypes.INTEGER,
            autoIncrement:true,
            primaryKey:true,
        },
        eventId:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references:{
                model:"events",
                key:"id"
            },
            onDelete:"CASCADE",
            onUpdate:"CASCADE"
        },
        location:{
            type:DataTypes.STRING,
            allowNull:false
        },
        date:{
            type:DataTypes.DATEONLY,
            allowNull:false
        },
        venue:{
            type:DataTypes.STRING,
            allowNull:false
        },
    },
    {
        sequelize,
        modelName:"EventDate",
        tableName:"event_dates",
        timestamps:true
    }
)

module.exports={EventDate}