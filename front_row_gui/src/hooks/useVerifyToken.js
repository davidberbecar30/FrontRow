// On app load, checks whether the stored token is still valid by calling
// GET /auth/me. If the server returns 401 the session is cleared.
// Returns { verifying, verified, user } so components can show a loading
// state while the check is in flight.

import { useState, useEffect } from 'react'
import { getToken, setCurrentUser, clearCurrentUser, getCurrentUser } from '../auth/currentUser'

// Import from authAPI directly to avoid the global 401 redirect in apiFetch
const API_BASE = import.meta.env.VITE_API_URL || ''
const BASE_URL = `${API_BASE}/auth`

export function useVerifyToken() {
    const [state, setState] = useState({
        verifying: true,
        verified:  false,
        user:      getCurrentUser()
    })

    useEffect(() => {
        const token = getToken()
        if (!token) {
            setState({ verifying: false, verified: false, user: null })
            return
        }

        fetch(`${BASE_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error('Token invalid')
                // Read refreshed token
                const refreshed = res.headers.get('X-New-Token')
                if (refreshed) {
                    localStorage.setItem('authToken', refreshed)
                }
                return res.json()
            })
            .then(data => {
                setCurrentUser(data.user)
                setState({ verifying: false, verified: true, user: data.user })
            })
            .catch(() => {
                clearCurrentUser()
                setState({ verifying: false, verified: false, user: null })
            })
    }, [])

    return state
}

export default useVerifyToken
