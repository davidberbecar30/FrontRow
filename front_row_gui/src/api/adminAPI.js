import { apiFetch } from './apiFetch'

const SERVER_IP = '192.168.1.8'
const BASE_URL = `http://${SERVER_IP}:3000/admin`

export async function getObservations() {
    const res = await apiFetch(`${BASE_URL}/observations`)
    if (!res.ok) throw new Error('Failed to fetch observations')
    return res.json()
}

export async function clearObservation(id) {
    const res = await apiFetch(`${BASE_URL}/observations/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to clear observation')
    return res.json()
}

export async function getLogs(limit = 100) {
    const res = await apiFetch(`${BASE_URL}/logs?limit=${limit}`)
    if (!res.ok) throw new Error('Failed to fetch logs')
    return res.json()
}
