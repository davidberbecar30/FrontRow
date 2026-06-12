import { apiFetch } from './apiFetch'

export async function getActiveDraw() {
    const res = await apiFetch('/prize-draw/active')
    if (!res.ok) throw new Error('Failed to fetch active draw')
    return res.json()   // null | { id, eventTitle, eventImage, endsAt, userOptedIn, ... }
}

export async function enterDraw(drawId) {
    const res = await apiFetch(`/prize-draw/${drawId}/enter`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Failed to enter draw')
    return data
}

export async function startDraw({ eventId, eventDateId, prizeDescription, durationHours }) {
    const res = await apiFetch('/prize-draw', {
        method: 'POST',
        body: JSON.stringify({ eventId, eventDateId, prizeDescription, durationHours })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Failed to start draw')
    return data
}

export async function listDraws() {
    const res = await apiFetch('/prize-draw')
    if (!res.ok) throw new Error('Failed to fetch draws')
    return res.json()
}

export async function getMyResult() {
    const res = await apiFetch('/prize-draw/my-result')
    if (!res.ok) throw new Error('Failed to fetch result')
    return res.json()
}
