const EVENTS_KEY="offline events"
const PENDING_KEY="offline pending"

export function getLocalEvents(){
    const data=localStorage.getItem(EVENTS_KEY)
    if(!data){
        return []
    }
    return JSON.parse(data)
}

export function saveLocalEvents(events){
    localStorage.setItem(EVENTS_KEY,JSON.stringify(events))
}

export function getPendingActions(){
    const data=localStorage.getItem(PENDING_KEY)
    if(!data){
        return []
    }
    return JSON.parse(data)
}

export function savePendingActions(actions){
    localStorage.setItem(PENDING_KEY,JSON.stringify(actions))
}

export function addPendingAction(action){
    const actions=getPendingActions()
    actions.push(action)
    savePendingActions(actions)
}

export function clearPendingActions(){localStorage.removeItem(PENDING_KEY)}

export function isOnline(){return navigator.onLine}

export function getLocalEventspaginated({ page = 1, limit = 4, search = '' } = {}) {
    let events = getLocalEvents()

    if (search) {
        events = events.filter(e =>
            e.title.toLowerCase().includes(search.toLowerCase())
        )
    }

    const total = events.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const paginated = events.slice(start, start + limit)

    return {
        data: paginated,
        pagination: {
            total,
            totalPages,
            currentPage: Number(page),
            limit: Number(limit)
        }
    }
}

export function getLocalEventById(id) {
    const events = getLocalEvents()
    return events.find(e => e.id === Number(id)) || null
}

export function addLocalEvent(eventDetails) {
    const events = getLocalEvents()
    const newEvent = {
        ...eventDetails,
        id: Date.now(),
        favorited: false,
        _offline: true  // mark as created offline
    }
    events.push(newEvent)
    saveLocalEvents(events)
    return newEvent
}

export function updateLocalEvent(id, eventDetails) {
    const events = getLocalEvents()
    const index = events.findIndex(e => e.id === Number(id))
    if (index === -1) return null
    events[index] = { ...events[index], ...eventDetails }
    saveLocalEvents(events)
    return events[index]
}

export function deleteLocalEvent(id) {
    const events = getLocalEvents()
    const index = events.findIndex(e => e.id === Number(id))
    if (index === -1) return null
    const removed = events[index]
    events.splice(index, 1)
    saveLocalEvents(events)
    return removed
}

export function toggleLocalFavorite(id) {
    const events = getLocalEvents()
    const index = events.findIndex(e => e.id === Number(id))
    if (index === -1) return null
    events[index].favorited = !events[index].favorited
    saveLocalEvents(events)
    return events[index]
}