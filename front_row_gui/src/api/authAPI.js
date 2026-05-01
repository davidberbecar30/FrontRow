const SERVER_IP = '192.168.1.7'
const BASE_URL = `http://${SERVER_IP}:3000/auth`

async function postJSON(url, body) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
        const message = data.error || data.message || `Request failed (${response.status})`
        throw new Error(message)
    }
    return data
}

export async function register(userData) {
    return postJSON(`${BASE_URL}/register`, userData)
}

export async function login(email, password) {
    return postJSON(`${BASE_URL}/login`, { email, password })
}
