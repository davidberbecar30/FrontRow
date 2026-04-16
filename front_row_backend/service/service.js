const repository = require("../repository/repository")

class EventService{
    
    getEvents({ page = 1, limit = 4, category, search } = {}) {
    let events = repository.getAllEvents()

    if (category) {
        events = events.filter(e => e.category.toLowerCase() === category.toLowerCase())
    }

    if (search) {
        events = events.filter(e => e.title.toLowerCase().includes(search.toLowerCase()))
    }

    const pageNum = Number(page) || 1
    const limitNum = Number(limit) || 4

    const total = events.length
    const totalPages = Math.ceil(total / limitNum)
    const start = (pageNum - 1) * limitNum          
    const end = start + limitNum 

    const paginated = events.slice(start, end)

    return {
        data: paginated,
        pagination: {
            total,
            totalPages,
            currentPage: pageNum,   
            limit: limitNum         
        }
    }
}

    addEvent(eventDetails){
        return repository.addEvent(eventDetails)
    }

    deleteEvent(id){
        return repository.deleteEvent(id)
    }

    updateEvent(id,eventDetails){
        return repository.updateEvent(id,eventDetails)
    }

    getEventById(id){
        return repository.getEventById(id)
    }

    toggleFavorite(id){
        return repository.toggleFavorite(id)
    }

    getStatistics(){
        const events=repository.getAllEvents()

        const categoryEventsMap={}
        events.forEach(e=>
            categoryEventsMap[e.category]=(categoryEventsMap[e.category] || 0)+1
        )

        const trending=events.sort((a,b)=>b.price-a.price).slice(0,6)
        const ticketsAvailability = events.map(e => ({
            id: e.id,
            title: e.title,
            availableTickets: e.availableTickets
        }))

        return {
            totalEvents: events.length,
            categoryBreakdown: categoryEventsMap,
            trending,
            ticketsAvailability
        }
    }
}

module.exports=new EventService()
    

