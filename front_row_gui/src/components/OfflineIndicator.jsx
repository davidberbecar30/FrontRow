import { useState, useEffect } from 'react'

function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine)

    useEffect(() => {
        window.addEventListener('online', () => setIsOffline(false))
        window.addEventListener('offline', () => setIsOffline(true))
        return () => {
            window.removeEventListener('online', () => setIsOffline(false))
            window.removeEventListener('offline', () => setIsOffline(true))
        }
    }, [])

    if (!isOffline) return null

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: '#FF7675',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '10px',
            fontFamily: 'Inter',
            fontWeight: 700,
            zIndex: 9999,
            boxShadow: '0px 4px 10px rgba(0,0,0,0.25)'
        }}>
            You are offline — changes will sync when reconnected
        </div>
    )
}

export default OfflineIndicator;