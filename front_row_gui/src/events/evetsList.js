
import drakeCover from "../assets/drakeCover.jpeg"
import bruno_mars from "../assets/bruno_mars.jpeg"
import kingsLogo from "../assets/Kings-New-Logo-confirmed.png"
import davidBlaine from "../assets/david_bliane.jpg"

export const events = [
    {
        id: 1,
        title: "Drake Tour",
        price: 135,
        image: drakeCover,
        availableTickets: 200,
        category: "Concert",
        description: "Experience Drake performing hits live.",
        favorited: true,
        dates: [
            { date: "2026-08-24", location: "Los Angeles, CA", venue: "Crypto.com Arena" },
            { date: "2026-09-01", location: "New York, NY",    venue: "Madison Square Garden" },
            { date: "2026-09-15", location: "Chicago, IL",     venue: "United Center" },
        ]
    },
    {
        id: 2,
        title: "Bruno Mars",
        price: 89,
        image: bruno_mars,
        availableTickets: 150,
        category: "Concert",
        description: "An unforgettable Bruno Mars live experience.",
        favorited: false,
        dates: [
            { date: "2026-09-12", location: "Nashville, TN",  venue: "Bridgestone Arena" },
            { date: "2026-09-20", location: "Atlanta, GA",    venue: "State Farm Arena" },
        ]
    },
    {
        id: 3,
        title: "Sacramento Kings vs LA Lakers",
        price: 38,
        image: kingsLogo,
        availableTickets: 500,
        category: "Sports",
        description: "An electrifying NBA matchup between the Sacramento Kings and the LA Lakers.",
        favorited: false,
        dates: [
            { date: "2026-12-06", location: "Sacramento, CA", venue: "Golden 1 Center" },
            { date: "2026-12-20", location: "Los Angeles, CA", venue: "Crypto.com Arena" },
        ]
    },
    {
        id: 4,
        title: "David Blaine Magic Show",
        price: 215,
        image: davidBlaine,
        availableTickets: 100,
        category: "Magic",
        description: "Experience the impossible with David Blaine's breathtaking live magic show.",
        favorited: false,
        dates: [
            { date: "2026-10-03", location: "New York, NY", venue: "Madison Square Garden" },
            { date: "2026-10-15", location: "Las Vegas, NV", venue: "MGM Grand Garden Arena" },
            { date: "2026-11-01", location: "Los Angeles, CA", venue: "Hollywood Bowl" },
        ]
    },
    {
        id: 5,
        title: "David Blaine Magic Show",
        price: 215,
        image: davidBlaine,
        availableTickets: 100,
        category: "Magic",
        description: "Experience the impossible with David Blaine's breathtaking live magic show.",
        favorited: false,
        dates: [
            { date: "2026-10-03", location: "New York, NY", venue: "Madison Square Garden" },
            { date: "2026-10-15", location: "Las Vegas, NV", venue: "MGM Grand Garden Arena" },
            { date: "2026-11-01", location: "Los Angeles, CA", venue: "Hollywood Bowl" },
        ]
    },
]

export function getEvents(){
    return events;
}

export function getEventById(id){return events.find(e => e.id === id);}

export function getEventsByArtist(artist){
    return events.filter(e=>e.title.includes(artist))
}

export function addEvent(event){
    const newEvent={...event, id:Date.now(),favorited:false};
    events.push(newEvent)
}

export function deleteEvent(id){
    const index=events.findIndex(e=>e.id===Number(id));
    if(index!==-1){
        events.splice(index,1);
    }
}

export function updateEvent(id, updated) {
    const index = events.findIndex(e => e.id === Number(id))
    if (index !== -1) events[index] = { ...events[index], ...updated }
}

export function toggleFavorite(id) {
    const index = events.findIndex(e => e.id === Number(id));
    if (index === -1) return null;

    events[index] = { ...events[index], favorited: !events[index].favorited };
    return events[index];
}