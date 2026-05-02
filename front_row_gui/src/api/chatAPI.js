import { apiFetch } from './apiFetch'

const SERVER_IP = '192.168.1.7'
const BASE_URL = `http://${SERVER_IP}:3000/chat`

export async function getMessages(room = 'lobby', limit = 50) {
    const url = `${BASE_URL}?room=${encodeURIComponent(room)}&limit=${limit}`
    const response = await apiFetch(url)
    if (!response.ok) throw new Error('Failed to fetch chat history')
    return response.json()
}
