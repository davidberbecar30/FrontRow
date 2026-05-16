// Auth state held in localStorage. Stores both the user profile and the JWT.
// Components listen for `authChange` events to react to login/logout.
//
// Inactivity timeout: after SESSION_TIMEOUT_MS of no user interaction the
// session is automatically cleared (= forced logout).

const USER_KEY           = 'currentUser'
const TOKEN_KEY          = 'authToken'
const LAST_ACTIVITY_KEY  = 'lastActivity'
const SESSION_TIMEOUT_MS = 30 * 60 * 1000   // 30 minutes (must match backend TOKEN_TTL_SECONDS)

// ── Safe localStorage access (handles test/jsdom/denied environments) ──

function ls() {
    try {
        return typeof window !== 'undefined' &&
               window.localStorage &&
               typeof window.localStorage.getItem === 'function'
            ? window.localStorage
            : null
    } catch {
        return null
    }
}

function lsGet(key) {
    const s = ls()
    if (!s) return null
    try { return s.getItem(key) } catch { return null }
}

function lsSet(key, val) {
    const s = ls()
    if (!s) return
    try { s.setItem(key, String(val)) } catch { /* noop */ }
}

function lsRemove(key) {
    const s = ls()
    if (!s) return
    try { s.removeItem(key) } catch { /* noop */ }
}

// ── Inactivity tracking ───────────────────────────────────────────
// A single shared listener is installed once. It bumps the activity
// timestamp on every user interaction so we can detect idleness.

let inactivityGuardInstalled = false

function installInactivityGuard() {
    if (inactivityGuardInstalled) return
    inactivityGuardInstalled = true

    const bump = () => {
        lsSet(LAST_ACTIVITY_KEY, Date.now().toString())
    }

    // Bump on any meaningful user interaction
    const events = ['click', 'keydown', 'scroll', 'mousemove', 'touchstart']
    events.forEach(ev => {
        try { window.addEventListener(ev, bump, { passive: true }) } catch { /* noop */ }
    })

    // Poll every 10 s to see if the session has expired.
    // This catches cases where the user leaves the tab open and walks away.
    setInterval(() => {
        const user = getCurrentUser()
        if (!user) return

        const lastRaw = lsGet(LAST_ACTIVITY_KEY)
        if (!lastRaw) return

        const elapsed = Date.now() - parseInt(lastRaw, 10)
        if (elapsed > SESSION_TIMEOUT_MS) {
            console.log('[Auth] Session expired due to inactivity')
            clearCurrentUser()
            // Redirect to login if not already there
            try {
                if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                    window.location.href = '/login'
                }
            } catch { /* noop */ }
        }
    }, 10_000)
}

// Call early so the guard is active as soon as the module loads.
installInactivityGuard()

// ── User ────────────────────────────────────────────────────────

export function getCurrentUser() {
    try {
        const raw = lsGet(USER_KEY)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

export function setCurrentUser(user) {
    lsSet(USER_KEY, JSON.stringify(user))
    try { window.dispatchEvent(new Event('authChange')) } catch { /* noop */ }
}

export function clearCurrentUser() {
    lsRemove(USER_KEY)
    lsRemove(TOKEN_KEY)
    lsRemove(LAST_ACTIVITY_KEY)
    try { window.dispatchEvent(new Event('authChange')) } catch { /* noop */ }
}

// ── Token ────────────────────────────────────────────────────────

export function getToken() {
    return lsGet(TOKEN_KEY)
}

export function setToken(token) {
    if (!token) return
    lsSet(TOKEN_KEY, token)
}

// Convenience: save both at login/register time
export function setSession({ user, token }) {
    setToken(token)
    setCurrentUser(user)
    // Mark activity so the timeout clock starts now
    lsSet(LAST_ACTIVITY_KEY, Date.now().toString())
}

// ── Permission helpers ──────────────────────────────────────────

export function isLoggedIn() {
    return getCurrentUser() !== null && getToken() !== null
}

export function hasPermission(name) {
    const user = getCurrentUser()
    if (!user || !user.role || !user.role.permissions) return false
    return user.role.permissions.some(p => p.name === name)
}

export function isAdmin() {
    const user = getCurrentUser()
    return user?.role?.name === 'admin'
}
