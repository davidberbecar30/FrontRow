const {Model, DataTypes}=require('sequelize')
const sequelize=require('../db')

class Event extends Model{}

// class Event {
//     static nextId=1
//     constructor({
//         title,
//         description,
//         category,
//         price,
//         availableTickets,
//         dates,
//         image = null,
//         favorited = false
//     }) {
//         this.id =Event.nextId++
//         this.title = title
//         this.description = description
//         this.category = category
//         this.price = Number(price)
//         this.availableTickets = Number(availableTickets)
//         this.dates = dates    // array of { date, location, venue }
//         this.image = image
//         this.favorited = favorited
//     }
// }

Event.init(
{
    id:{
        type: DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },
    title:{
        type: DataTypes.STRING,
        allowNull:false
    },
    description:{
        type:DataTypes.TEXT,
        allowNull:true
    },
    category:{
        type:DataTypes.STRING,
        allowNull:false
    },
    price:{
        type:DataTypes.DECIMAL(10,2),
        allowNull:false,
        validate:{min:0}
    },
    availableTickets:{
        type:DataTypes.INTEGER,
        allowNull:false,
        validate:{min:0}
    },
    image:{
        type:DataTypes.STRING,
        allowNull:true
    },
    favorited:{
        type:DataTypes.BOOLEAN,
        allowNull:false,
        defaultValue:false
    },
},
{
    sequelize,
    modelName:"Event",
    tableName:"events",
    timestamps:true
}
)

module.exports = { Event }