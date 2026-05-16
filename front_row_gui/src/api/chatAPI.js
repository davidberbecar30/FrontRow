import { apiFetch } from './apiFetch'

const BASE_URL = '/chat'

export async function getMessages(room = 'lobby', limit = 50) {
    const url = `${BASE_URL}?room=${encodeURIComponent(room)}&limit=${limit}`
    const response = await apiFetch(url)
    if (!response.ok) throw new Error('Failed to fetch chat history')
    return response.json()
}
