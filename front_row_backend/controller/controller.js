const service=require("../service/service")

class EventController{

    getAllEvents(req,res){
        const {page,limit,category,search}=req.query
        const result=service.getEvents({page:Number(page),limit:Number(limit),category,search})
        return res.status(200).json(result)
    }

    getEventById(req,res){
        const id=Number(req.params.id)
        const event=service.getEventById(id)
        if(!event){
            return res.status(404).json({message:`Event with id ${id} not found`})
        }
        return res.status(200).json(event)
    }

    addEvent(req,res){
        const eventDetails=req.body
        if(!eventDetails){
            return res.status(400).json("Body is incorrect")
        }
        const addedEvent=service.addEvent(eventDetails)
        if(!addedEvent){
            return res.status(400).json("Event could not be added")
        }
        return res.status(201).json(addedEvent)
    }

    updateEvent(req,res){
        const id=Number(req.params.id)
        const eventDetails=req.body
        const existingEvent=service.getEventById(id)
        if(!existingEvent){
            return res.status(404).json({message: `Event with id ${id} wasnt found.`})
        }
        const updated=service.updateEvent(id,eventDetails)
        if(!updated){
            return res.status(400).json({message: "Event could not be updated"})
        }
        return res.status(200).json(updated)
    }

    deleteEvent(req,res){
        const id=Number(req.params.id)
        const deleted=service.deleteEvent(id)
        if(!deleted){
            return res.status(404).json({message: "Event wasnt deleted."})
        }
        return res.status(200).json(deleted)
    }

    toggleFavorite(req,res){
        const id=Number(req.params.id)
        const favorited=service.toggleFavorite(id)
        if(!favorited){
            return res.status(404).json({message:"Could not toggle for event"})
        }
        return res.status(200).json(favorited)
    }

    getStatistics(req,res){
        return res.status(200).json(service.getStatistics())
    }

}

module.exports=new EventController()