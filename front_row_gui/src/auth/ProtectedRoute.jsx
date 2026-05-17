// Route guard that checks authentication / permission before rendering.
// Redirects to /login if the user is not authenticated.
// Optionally checks a specific permission when the `permission` prop is set.

import { Navigate, useLocation } from 'react-router-dom'
import { isLoggedIn, hasPermission } from './currentUser'

export function ProtectedRoute({ children, permission }) {
    const location = useLocation()

    if (!isLoggedIn()) {
        // Preserve the URL they tried to visit so we can redirect back after login
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (permission && !hasPermission(permission)) {
        return <Navigate to="/events" replace />
    }

    return children
}

export default ProtectedRoute
