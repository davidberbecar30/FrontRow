const{ Event } =require("../model/Event")

class EventRepository{
    events=[
        new Event({
            title: "Drake Tour",
            price: 135,
            availableTickets: 200,
            category: "Concert",
            description: "Experience Drake performing hits live.",
            favorited: true,
            image: "http://localhost:3000/images/drakeCover.jpeg",
            dates: [
                { date: "2026-08-24", location: "Los Angeles, CA", venue: "Crypto.com Arena" },
                { date: "2026-09-01", location: "New York, NY", venue: "Madison Square Garden" },
                { date: "2026-09-15", location: "Chicago, IL", venue: "United Center" },
            ]
        }),
        new Event({
            title: "Bruno Mars",
            price: 89,
            availableTickets: 150,
            category: "Concert",
            description: "An unforgettable Bruno Mars live experience.",
            favorited: false,
            image:"http://localhost:3000/images/bruno_mars.jpeg",
            dates: [
                { date: "2026-09-12", location: "Nashville, TN", venue: "Bridgestone Arena" },
                { date: "2026-09-20", location: "Atlanta, GA", venue: "State Farm Arena" },
            ]
        }),
        new Event({
            title: "Sacramento Kings vs LA Lakers",
            price: 38,
            availableTickets: 500,
            category: "Sports",
            description: "An electrifying NBA matchup between the Sacramento Kings and the LA Lakers.",
            favorited: false,
            image: "http://localhost:3000/images/Kings-New-Logo-confirmed.png",
            dates: [
                { date: "2026-12-06", location: "Sacramento, CA", venue: "Golden 1 Center" },
                { date: "2026-12-20", location: "Los Angeles, CA", venue: "Crypto.com Arena" },
            ]
        }),
        new Event({
            title: "David Blaine Magic Show",
            price: 215,
            availableTickets: 100,
            category: "Magic",
            description: "Experience the impossible with David Blaine's breathtaking live magic show.",
            favorited: false,
            image:"http://localhost:3000/images/david_bliane.jpg",
            dates: [
                { date: "2026-10-03", location: "New York, NY", venue: "Madison Square Garden" },
                { date: "2026-10-15", location: "Las Vegas, NV", venue: "MGM Grand Garden Arena" },
                { date: "2026-11-01", location: "Los Angeles, CA", venue: "Hollywood Bowl" },
                ]
            }),
        ]

    constructor(){}

    getAllEvents(){
        return this.events
    }

    getEventById(id){
        return this.events.find(e=>e.id==Number(id))
    }

    addEvent(eventDetails){
        const toAdd=new Event(eventDetails)
        this.events.push(toAdd)
        return toAdd;
    }

    updateEvent(id, eventDetails){
        const index=this.events.findIndex(e=>e.id==Number(id))
        if(index==-1){
            return null;
        }

        this.events[index]={...this.events[index],...eventDetails}
        return this.events[index]
    }

    deleteEvent(id){
        const index=this.events.findIndex(e=>e.id==Number(id))
        if(index==-1){
            return null;
        }
        const removed=this.events[index]
        this.events= this.events.filter(e=>e.id!=Number(id))
        return removed
    }

    toggleFavorite(id){
        const index=this.events.findIndex(e=>e.id==Number(id))
        if(index==-1){
            return null;
        }
        this.events[index].favorited = !this.events[index].favorited
        return this.events[index]
    }

}
module.exports=new EventRepository();