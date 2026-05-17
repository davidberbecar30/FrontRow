const {Model,DataTypes}=require('sequelize')
const sequelize= require('../db')

// class Ticket {
//     static nextId = 1

//     constructor({
//         eventId,
//         seat,
//         section,
//         status = 'available',
//         price = null
//     }) {
//         this.id = Ticket.nextId++
//         this.eventId = Number(eventId)
//         this.seat = seat
//         this.section = section
//         this.status = status  // available, sold, reserved
//         this.price = price ? Number(price) : null
//     }
// }

class Ticket extends Model{}

Ticket.init(
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
                key:"id",
            },
            onDelete:"CASCADE",
            onUpdate:"CASCADE"
        },
        seat:{
            type:DataTypes.STRING,
            allowNull:false
        },
        section:{
            type:DataTypes.STRING,
            allowNull:false,
        },
        status:{
            type:DataTypes.ENUM("available","sold","reserved"),
            allowNull:false,
            defaultValue:"available"
        },
        price:{
            type:DataTypes.DECIMAL(10,2),
            allowNull:false,
            validate:{min:0},
        },
    },
    {
            sequelize,
            modelName:"Ticket",
            tableName:"tickets",
            timestamps:true,
    }
)


module.exports = { Ticket }