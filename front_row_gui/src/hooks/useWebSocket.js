import { useEffect, useRef } from 'react'

// Use VITE_WS_URL if set (production), otherwise derive from current page (local dev)
function wsUrl() {
    if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/ws`
}

export function useWebSocket(onMessage) {
    const ws = useRef(null)

    useEffect(() => {
        ws.current = new WebSocket(wsUrl())

        ws.current.onopen = () => {
            console.log('WebSocket connected')
        }

        ws.current.onmessage = (event) => {
            const message = JSON.parse(event.data)
            onMessage(message)
        }

        ws.current.onclose = () => {
            console.log('WebSocket disconnected')
        }

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error)
        }

        return () => {
            ws.current.close()
        }
    }, [])
}
