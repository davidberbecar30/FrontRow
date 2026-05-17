import { getToken, setToken, clearCurrentUser } from '../auth/currentUser'

// Wraps fetch with three responsibilities:
//   1. Attaches `Authorization: Bearer <token>` if we have one.
//   2. Reads the `X-New-Token` header (sliding session) and stores the refreshed token.
//   3. On 401, clears the session — the next route check will redirect to /login.
//   4. Bumps the inactivity timer so active API usage keeps the session alive.

export async function apiFetch(url, options = {}) {
    const token = getToken()
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, { ...options, headers })

    // Sliding session — backend issues a fresh token on every authed request
    const refreshed = response.headers.get('X-New-Token')
    if (refreshed) {
        setToken(refreshed)
        // Reset inactivity timer — active API usage === user is still here
        localStorage.setItem('lastActivity', Date.now().toString())
    }

    // Global 401 handling — token expired or invalid
    if (response.status === 401 && token) {
        // Only auto-clear if we *tried* to authenticate.
        // (An unauthenticated 401 from /login itself just means wrong password.)
        clearCurrentUser()
        // Redirect via hash so any route guard catches it
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login'
        }
    }

    return response
}
