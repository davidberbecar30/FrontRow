import { useEffect, useRef } from 'react'

// const WS_URL='ws://localhost:3000'
const SERVER_IP = '192.168.1.8'; // Use the IP from your Server PC
const WS_URL=`ws://${SERVER_IP}:3000`;

export function useWebSocket(onMessage) {
    const ws = useRef(null)

    useEffect(() => {
        ws.current = new WebSocket(WS_URL)

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