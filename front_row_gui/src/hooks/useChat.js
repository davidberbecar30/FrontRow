import { useEffect, useRef, useState, useCallback } from 'react'
import { getMessages } from '../api/chatAPI'

// Derive WebSocket URL from current page — works from any machine on LAN
function wsUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/ws`
}

export function useChat(room = 'lobby') {
    const [messages, setMessages] = useState([])
    const [connected, setConnected] = useState(false)
    const [error, setError] = useState(null)
    const wsRef = useRef(null)

    useEffect(() => {
        let cancelled = false
        getMessages(room)
            .then(data => {
                if (!cancelled) setMessages(data)
            })
            .catch(err => {
                if (!cancelled) setError(err.message)
            })
        return () => {
            cancelled = true
        }
    }, [room])

    useEffect(() => {
        const ws = new WebSocket(wsUrl())
        wsRef.current = ws

        ws.onopen = () => setConnected(true)
        ws.onclose = () => setConnected(false)
        ws.onerror = () => setError('WebSocket error')

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                if (data.type === 'CHAT_MESSAGE' && data.message) {
                    // Only add messages for the room this hook is watching
                    if (data.message.room === room) {
                        setMessages(prev => [...prev, data.message])
                    }
                } else if (data.type === 'CHAT_ERROR') {
                    setError(data.error)
                }
            } catch {
                // ignore non-JSON or unrelated messages
            }
        }

        return () => ws.close()
    }, [room])

    const sendMessage = useCallback((text, user) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setError('Not connected to chat server')
            return
        }
        if (!text.trim() || !user) return
        wsRef.current.send(JSON.stringify({
            type: 'CHAT_MESSAGE',
            from: user.id,
            fromName: user.firstName || 'Anonymous',
            text: text.trim(),
            room
        }))
    }, [room])

    return {messages, sendMessage, connected, error}
}
