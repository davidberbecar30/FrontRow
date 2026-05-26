import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setSession } from '../auth/currentUser'

// Landing page after Google/GitHub OAuth redirect.
// Reads the base64-encoded session from the URL, saves it, then navigates to /events.
function OAuthCallbackView() {
    const navigate = useNavigate()
    const [params] = useSearchParams()

    useEffect(() => {
        const sessionParam = params.get('session')
        const error        = params.get('error')

        if (error || !sessionParam) {
            navigate('/login?error=oauth_failed', { replace: true })
            return
        }

        try {
            const result = JSON.parse(atob(sessionParam))
            setSession({ user: result.user, token: result.token, refreshToken: result.refreshToken })
            navigate('/events', { replace: true })
        } catch {
            navigate('/login?error=oauth_failed', { replace: true })
        }
    }, [])

    return (
        <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            height: '100vh', fontFamily: 'sans-serif', color: '#6C5CE7'
        }}>
            <p>Signing you in…</p>
        </div>
    )
}

export default OAuthCallbackView
