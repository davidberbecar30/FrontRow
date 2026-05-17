import { apiFetch } from './apiFetch'
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

const BASE_URL = '/events';

export async function syncWithServer() {
    const pending = getPendingActions()

    for (const action of pending) {
        try {
            const { type, payload, options } = action
            let response

            switch (type) {
                case 'ADD_EVENT':
                    response = await apiFetch(`${BASE_URL}`, {
                        method: 'POST',
                        body: JSON.stringify(payload),
                        headers: options?.headers || {}
                    })
                    if (response.ok) {
                        const data = await response.json()
                        saveLocalEvents(data.event || data)
                    }
                    break
                case 'UPDATE_EVENT':
                    response = await apiFetch(`${BASE_URL}/${payload.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(payload),
                        headers: options?.headers || {}
                    })
                    if (response.ok) {
                        const data = await response.json()
                        saveLocalEvents(data.event || data)
                    }
                    break
                case 'DELETE_EVENT':
                    response = await apiFetch(`${BASE_URL}/${payload.id}`, {
                        method: 'DELETE'
                    })
                    if (response.ok) {
                        saveLocalEvents(payload)
                    }
                    break
                default:
                    console.warn('Unknown pending action type:', type)
            }
        } catch (error) {
            console.error('Failed to sync action:', action, error)
        }
    }

    clearPendingActions()
}

export async function getEvents({ page = 1, limit = 4, search = '', category = '' } = {}) {
    const params = new URLSearchParams({ page, limit, search, category })
    const response = await apiFetch(`${BASE_URL}?${params}`)
    if (!response.ok) throw new Error('Failed to fetch events')
    return response.json()
}

export async function getEventById(id) {
    const localEvent = getLocalEventById(id)
    if (localEvent) return localEvent

    const response = await apiFetch(`${BASE_URL}/${id}`)
    if (!response.ok) throw new Error('Failed to fetch event')
    return response.json()
}

export async function addEvent(eventDetails) {
    if (!isOnline()) {
        addPendingAction({
            type: 'ADD_EVENT',
            payload: eventDetails,
            options: {
                headers: { 'Content-Type': 'application/json' }
            }
        })
        addLocalEvent(eventDetails)
        return { event: eventDetails, pending: true }
    }
    try {
        const response = await apiFetch(BASE_URL, {
            method: 'POST',
            body: JSON.stringify(eventDetails),
            headers: { 'Content-Type': 'application/json' }
        })
        if (!response.ok) throw new Error('Failed to add event')
        return response.json()
    } catch (error) {
        addPendingAction({
            type: 'ADD_EVENT',
            payload: eventDetails,
            options: {
                headers: { 'Content-Type': 'application/json' }
            }
        })
        addLocalEvent(eventDetails)
        return { event: eventDetails, pending: true }
    }
}

export async function updateEvent(id, eventDetails) {
    if (!isOnline()) {
        addPendingAction({
            type: 'UPDATE_EVENT',
            payload: { id, ...eventDetails },
            options: {
                headers: { 'Content-Type': 'application/json' }
            }
        })
        addLocalEvent(eventDetails)
        return { event: eventDetails, pending: true }
    }
    try {
        const response = await apiFetch(`${BASE_URL}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(eventDetails),
            headers: { 'Content-Type': 'application/json' }
        })
        if (!response.ok) throw new Error('Failed to update event')
        return response.json()
    } catch (error) {
        addPendingAction({
            type: 'UPDATE_EVENT',
            payload: { id, ...eventDetails },
            options: {
                headers: { 'Content-Type': 'application/json' }
            }
        })
        addLocalEvent(eventDetails)
        return { event: eventDetails, pending: true }
    }
}

export async function deleteEvent(id) {
    if (!isOnline()) {
        addPendingAction({ type: 'DELETE_EVENT', payload: { id } })
        return { pending: true }
    }
    try {
        const response = await apiFetch(`${BASE_URL}/${id}`, {
            method: 'DELETE'
        })
        if (!response.ok) throw new Error('Failed to delete event')
        return response.json()
    } catch (error) {
        addPendingAction({ type: 'DELETE_EVENT', payload: { id } })
        return { pending: true }
    }
}

export async function toggleFavorite(id) {
    if (!isOnline()) {
        addPendingAction({ type: 'TOGGLE_FAVORITE', payload: { id } })
        toggleLocalFavorite(id)
        return { pending: true }
    }
    try {
        const response = await apiFetch(`${BASE_URL}/${id}/favorite`, {
            method: 'POST'
        })
        if (!response.ok) throw new Error('Failed to toggle favorite')
        return response.json()
    } catch (error) {
        addPendingAction({ type: 'TOGGLE_FAVORITE', payload: { id } })
        toggleLocalFavorite(id)
        return { pending: true }
    }
}

export async function getStatistics() {
    try {
        const response = await apiFetch(`${BASE_URL}/statistics`)
        if (!response.ok) throw new Error('Failed to fetch statistics')
        const data = await response.json()

        if (data.events && data.events.length > 0) {
            const ticketsAvailability = data.events.map(e => ({
                event_id: e.id,
                title: e.title,
                total_tickets: e.total_tickets || 0,
                booked_tickets: e.booked_tickets || 0
            }))
            return { ...data, ticketsAvailability }
        }

        return data
    } catch (error) {
        const totalTicketsGlobal = 800
        const bookedTicketsGlobal = 350

        const events = [
            {
                id: 1,
                title: 'Sample Event',
                total_tickets: 200,
                booked_tickets: 100
            }
        ]

        const ticketsAvailability = events.map(e => ({
            event_id: e.id,
            title: e.title,
            total_tickets: e.total_tickets,
            booked_tickets: e.booked_tickets
        }))

        return {
            events,
            ticketsAvailability,
            totalTickets: totalTicketsGlobal,
            bookedTickets: bookedTicketsGlobal
        }
    }
}

export async function getTicketsByEventId(eventId) {
    const response = await apiFetch(`${BASE_URL}/${eventId}/tickets`)
    if (!response.ok) throw new Error('Failed to fetch tickets')
    return response.json()
}

export async function getTicketStatsByEventId(eventId) {
    const response = await apiFetch(`${BASE_URL}/${eventId}/tickets/stats`)
    if (!response.ok) throw new Error('Failed to fetch ticket stats')
    return response.json()
}

export async function addTicket(eventId, ticketData) {
    const response = await apiFetch(`${BASE_URL}/${eventId}/tickets`, {
        method: 'POST',
        body: JSON.stringify(ticketData),
        headers: { 'Content-Type': 'application/json' }
    })
    if (!response.ok) throw new Error('Failed to add ticket')
    return response.json()
}

export async function updateTicket(id, ticketData) {
    const response = await apiFetch(`${BASE_URL}/tickets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(ticketData),
        headers: { 'Content-Type': 'application/json' }
    })
    if (!response.ok) throw new Error('Failed to update ticket')
    return response.json()
}

export async function deleteTicket(id) {
    const response = await apiFetch(`${BASE_URL}/tickets/${id}`, {
        method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete ticket')
    return response.json()
}

export async function getGlobalTicketStats() {
    const response = await apiFetch(`${BASE_URL}/tickets/stats`)
    if (!response.ok) throw new Error('Failed to fetch global ticket stats')
    return response.json()
}
