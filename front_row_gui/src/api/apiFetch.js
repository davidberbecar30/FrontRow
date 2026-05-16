import { getCurrentUser } from '../auth/currentUser'

// Wraps fetch and automatically attaches the current user's identity headers.
// Use this everywhere in place of fetch() so the backend's logging middleware
// can attribute every request to a user.

export async function apiFetch(url, options = {}) {
    const user = getCurrentUser()
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    }
    if (user) {
        headers['X-User-Id']   = String(user.id)
        headers['X-User-Role'] = user.role?.name || ''
    }
    return fetch(url, { ...options, headers })
}
