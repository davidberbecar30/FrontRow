// Auth-specific API client. Uses plain fetch (no apiFetch) because:
//   - Login/register run *before* we have a token to attach.
//   - We don't want the global 401-redirect on a wrong-password login.

const BASE_URL = '/auth'

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
    return data    // { user, token }
}

export async function register(userData) {
    return postJSON(`${BASE_URL}/register`, userData)
}

export async function login(email, password) {
    return postJSON(`${BASE_URL}/login`, { email, password })
}
