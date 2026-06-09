import { useEffect, useRef } from 'react'

function wsUrl() {
    if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/ws`
}

export function useWebSocket(onMessage) {
    const onMessageRef = useRef(onMessage)
    onMessageRef.current = onMessage

    useEffect(() => {
        // Small delay so React StrictMode's immediate unmount/remount cycle
        // doesn't open a connection that gets torn down before it's established.
        let socket = null
        let active = true

        const timer = setTimeout(() => {
            if (!active) return

            socket = new WebSocket(wsUrl())

            socket.onopen = () => {
                if (active) console.log('WebSocket connected')
            }

            socket.onmessage = (event) => {
                if (!active) return
                try {
                    const message = JSON.parse(event.data)
                    onMessageRef.current(message)
                } catch {}
            }

            socket.onclose = () => {
                if (active) console.log('WebSocket disconnected')
            }

            // Silently ignore errors — the onclose fires right after
            // and provides enough information for debugging.
            socket.onerror = () => {}
        }, 50)

        return () => {
            active = false
            clearTimeout(timer)
            if (socket) socket.close()
        }
    }, [])
}
