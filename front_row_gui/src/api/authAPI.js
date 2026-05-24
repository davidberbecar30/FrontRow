// Auth-specific API client. Uses plain fetch (no apiFetch) because:
//   - Login/register run *before* we have a token to attach.
//   - We don't want the global 401-redirect on a wrong-password login.

const BASE_URL = '/auth'

async function postJSON(url, body, token) {
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
        const message = data.error || data.message || `Request failed (${response.status})`
        throw new Error(message)
    }
    return data
}

// ── Strategy 1: Local auth ───────────────────────────────────────────────────

export async function register(userData) {
    return postJSON(`${BASE_URL}/register`, userData)
    // returns { user, token, refreshToken }
}

export async function login(email, password) {
    return postJSON(`${BASE_URL}/login`, { email, password })
    // Returns { requiresTwoFactor: true, loginToken, email } on step 1
    // or { user, token, refreshToken } for OAuth/legacy flows
}

/** Verify the 6-digit 2FA code sent to the user's email. */
export async function verifyLoginCode(loginToken, code) {
    return postJSON(`${BASE_URL}/verify-login-code`, { loginToken, code })
    // returns { user, token, refreshToken }
}

// ── Session management ───────────────────────────────────────────────────────

/** Exchange a refresh token for a new access + refresh token pair. */
export async function refreshSession(refreshToken) {
    return postJSON(`${BASE_URL}/refresh`, { refreshToken })
    // returns { user, token, refreshToken }
}

/** Revoke the current refresh token (logout). */
export async function logout(refreshToken, accessToken) {
    return postJSON(`${BASE_URL}/logout`, { refreshToken }, accessToken)
}

// ── Password recovery ────────────────────────────────────────────────────────

/** Request a password-reset link. Always resolves — never reveals if email exists. */
export async function forgotPassword(email) {
    return postJSON(`${BASE_URL}/forgot-password`, { email })
}

/** Consume a reset token and set a new password. */
export async function resetPassword(token, newPassword) {
    return postJSON(`${BASE_URL}/reset-password`, { token, newPassword })
}

