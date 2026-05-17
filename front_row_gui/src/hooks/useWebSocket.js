import { useEffect, useRef } from 'react'

// Derive WebSocket URL from current page — works from any machine on LAN
function wsUrl() {
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
