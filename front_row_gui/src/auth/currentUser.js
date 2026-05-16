
const STORAGE_KEY = 'currentUser'

export function getCurrentUser() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

export function setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))

    window.dispatchEvent(new Event('authChange'))
}

export function clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new Event('authChange'))
}

export function isLoggedIn() {
    return getCurrentUser() !== null
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
