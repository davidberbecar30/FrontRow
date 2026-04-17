import {
    isOnline,
    getLocalEventspaginated,
    getLocalEventById,
    addLocalEvent,
    updateLocalEvent,
    deleteLocalEvent,
    toggleLocalFavorite,
    saveLocalEvents,
    addPendingAction,
    getPendingActions,
    clearPendingActions
} from './offlineManager.js'

const BASE_URL = 'http://localhost:3000/events'

export async function syncWithServer() {
    const pending = getPendingActions()
    if (pending.length === 0) return

    console.log(`Syncing ${pending.length} pending actions...`)

    for (const action of pending) {
        try {
            await fetch(action.url, action.options)
        } catch (err) {
            console.error('Sync failed for action:', action, err)
        }
    }

    clearPendingActions()

    // refresh local cache from server
    const response = await fetch(`${BASE_URL}?limit=100`)
    const data = await response.json()
    saveLocalEvents(data.data)

    console.log('Sync complete')
}

window.addEventListener('online', syncWithServer)


export async function getEvents({ page = 1, limit = 4, search = '', category = '' } = {}) {
    if (!isOnline()) {
        console.log('Offline — using local data')
        return getLocalEventspaginated({ page, limit, search })
    }

    try {
        const params = new URLSearchParams()
        if (page) params.append('page', page)
        if (limit) params.append('limit', limit)
        if (search) params.append('search', search)
        if (category) params.append('category', category)

        const response = await fetch(`${BASE_URL}?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch events')
        const data = await response.json()

        const allResponse = await fetch(`${BASE_URL}?limit=100`)
        const allData = await allResponse.json()
        saveLocalEvents(allData.data)

        return data
    } catch (err) {
        console.log('Server unreachable — using local data')
        return getLocalEventspaginated({ page, limit, search })
    }
}


export async function getEventById(id) {
    if (!isOnline()) {
        return getLocalEventById(id)
    }

    try {
        const response = await fetch(`${BASE_URL}/${id}`)
        if (!response.ok) throw new Error(`Failed to fetch event ${id}`)
        return await response.json()
    } catch (err) {
        console.log('Server unreachable — using local data')
        return getLocalEventById(id)
    }
}


export async function addEvent(eventDetails) {
    if (!isOnline()) {
        // save locally and queue action
        const newEvent = addLocalEvent(eventDetails)
        addPendingAction({
            url: BASE_URL,
            options: {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventDetails)
            }
        })
        return newEvent
    }

    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventDetails)
        })
        if (!response.ok) throw new Error('Failed to add event')
        return await response.json()
    } catch (err) {
        console.log('Server unreachable — saving locally')
        const newEvent = addLocalEvent(eventDetails)
        addPendingAction({
            url: BASE_URL,
            options: {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventDetails)
            }
        })
        return newEvent
    }
}


export async function updateEvent(id, eventDetails) {
    if (!isOnline()) {
        updateLocalEvent(id, eventDetails)
        addPendingAction({
            url: `${BASE_URL}/${id}`,
            options: {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventDetails)
            }
        })
        return updateLocalEvent(id, eventDetails)
    }

    try {
        const response = await fetch(`${BASE_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventDetails)
        })
        if (!response.ok) throw new Error('Failed to update event')
        return await response.json()
    } catch (err) {
        console.log('Server unreachable — updating locally')
        addPendingAction({
            url: `${BASE_URL}/${id}`,
            options: {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventDetails)
            }
        })
        return updateLocalEvent(id, eventDetails)
    }
}


export async function deleteEvent(id) {
    if (!isOnline()) {
        deleteLocalEvent(id)
        addPendingAction({
            url: `${BASE_URL}/${id}`,
            options: { method: 'DELETE' }
        })
        return { id }
    }

    try {
        const response = await fetch(`${BASE_URL}/${id}`, {
            method: 'DELETE'
        })
        if (!response.ok) throw new Error('Failed to delete event')
        return await response.json()
    } catch (err) {
        console.log('Server unreachable — deleting locally')
        addPendingAction({
            url: `${BASE_URL}/${id}`,
            options: { method: 'DELETE' }
        })
        return deleteLocalEvent(id)
    }
}


export async function toggleFavorite(id) {
    if (!isOnline()) {
        const updated = toggleLocalFavorite(id)
        addPendingAction({
            url: `${BASE_URL}/${id}/favorite`,
            options: { method: 'PATCH' }
        })
        return updated
    }

    try {
        const response = await fetch(`${BASE_URL}/${id}/favorite`, {
            method: 'PATCH'
        })
        if (!response.ok) throw new Error('Failed to toggle favorite')
        return await response.json()
    } catch (err) {
        console.log('Server unreachable — toggling locally')
        addPendingAction({
            url: `${BASE_URL}/${id}/favorite`,
            options: { method: 'PATCH' }
        })
        return toggleLocalFavorite(id)
    }
}


export async function getStatistics() {
    if (!isOnline()) {
        // calculate statistics from local data
        const { getLocalEvents } = await import('./offlineManager.js')
        const events = getLocalEvents()
        const categoryMap = {}
        events.forEach(e => {
            categoryMap[e.category] = (categoryMap[e.category] || 0) + 1
        })
        const trending = [...events].sort((a, b) => b.price - a.price).slice(0, 6)
        const ticketsAvailability = events.map(e => ({
            id: e.id,
            title: e.title,
            availableTickets: e.availableTickets
        }))
        return {
            totalEvents: events.length,
            categoryBreakdown: categoryMap,
            trending,
            ticketsAvailability
        }
    }

    try {
        const response = await fetch(`${BASE_URL}/statistics`)
        if (!response.ok) throw new Error('Failed to fetch statistics')
        return await response.json()
    } catch (err) {
        console.log('Server unreachable — calculating statistics locally')
        const { getLocalEvents } = await import('./offlineManager.js')
        const events = getLocalEvents()
        const categoryMap = {}
        events.forEach(e => {
            categoryMap[e.category] = (categoryMap[e.category] || 0) + 1
        })
        const trending = [...events].sort((a, b) => b.price - a.price).slice(0, 6)
        const ticketsAvailability = events.map(e => ({
            id: e.id,
            title: e.title,
            availableTickets: e.availableTickets
        }))
        return {
            totalEvents: events.length,
            categoryBreakdown: categoryMap,
            trending,
            ticketsAvailability
        }
    }
}