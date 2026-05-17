import { apiFetch } from './apiFetch'

const BASE_URL = '/admin'

export async function getObservations() {
    const res = await apiFetch(`${BASE_URL}/observations`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `Failed to fetch observations (${res.status})`)
    return data
}

export async function clearObservation(id) {
    const res = await apiFetch(`${BASE_URL}/observations/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `Failed to clear observation (${res.status})`)
    return data
}

export async function getLogs(limit = 100) {
    const res = await apiFetch(`${BASE_URL}/logs?limit=${limit}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `Failed to fetch logs (${res.status})`)
    return data
}
