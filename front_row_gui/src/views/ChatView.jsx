import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { useChat } from '../hooks/useChat'
import { getCurrentUser } from '../auth/currentUser'

function ChatView() {
    const navigate = useNavigate()
    const user = getCurrentUser()
    const { messages, sendMessage, connected, error } = useChat('lobby')
    const [input, setInput] = useState('')
    const messagesEndRef = useRef(null)

    // Auto-scroll to bottom whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Redirect to login if not logged in
    useEffect(() => {
        if (!user) navigate('/login')
    }, [user, navigate])

    if (!user) return null

    function handleSend() {
        if (!input.trim()) return
        sendMessage(input, user)
        setInput('')
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    function formatTime(iso) {
        const d = new Date(iso)
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div style={pageStyle}>
            <Header />
            <div style={containerStyle}>
                <div style={headerRowStyle}>
                    <h2 style={titleStyle}>Lobby</h2>
                    <span style={{
                        ...statusBadgeStyle,
                        backgroundColor: connected ? '#1D9E75' : '#FF7675'
                    }}>
                        {connected ? 'connected' : 'disconnected'}
                    </span>
                </div>

                {error && <div style={errorStyle}>{error}</div>}

                <div style={messagesStyle}>
                    {messages.length === 0 ? (
                        <p style={{ color: '#9988BB', textAlign: 'center', marginTop: '2rem' }}>
                            No messages yet. Be the first to say hi.
                        </p>
                    ) : (
                        messages.map((m) => {
                            const mine = m.from === user.id
                            return (
                                <div key={m._id} style={{
                                    ...messageRowStyle,
                                    justifyContent: mine ? 'flex-end' : 'flex-start'
                                }}>
                                    <div style={{
                                        ...bubbleStyle,
                                        backgroundColor: mine ? '#6C5CE7' : '#3D2A75',
                                    }}>
                                        <div style={metaStyle}>
                                            <strong>{m.fromName}</strong>
                                            <span style={timeStyle}>{formatTime(m.createdAt)}</span>
                                        </div>
                                        <div style={textStyle}>{m.text}</div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div style={inputRowStyle}>
                    <input
                        style={inputStyle}
                        type="text"
                        placeholder="Type a message..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={!connected}
                    />
                    <button
                        style={sendBtnStyle}
                        onClick={handleSend}
                        disabled={!connected || !input.trim()}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Inline styles ────────────────────────────────────────────────
const pageStyle = {
    backgroundColor: '#1A0F3F',
    minHeight: '100vh'
}
const containerStyle = {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem',
    color: 'white'
}
const headerRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem'
}
const titleStyle = { color: '#fff', margin: 0 }
const statusBadgeStyle = {
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '999px',
    fontSize: '0.85rem'
}
const errorStyle = {
    backgroundColor: '#FF7675',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    marginBottom: '1rem'
}
const messagesStyle = {
    backgroundColor: '#2D1F60',
    borderRadius: '12px',
    padding: '1rem',
    height: '500px',
    overflowY: 'auto',
    marginBottom: '1rem'
}
const messageRowStyle = {
    display: 'flex',
    marginBottom: '0.75rem'
}
const bubbleStyle = {
    maxWidth: '70%',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    color: 'white'
}
const metaStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    fontSize: '0.8rem',
    marginBottom: '0.25rem',
    opacity: 0.8
}
const timeStyle = { fontSize: '0.75rem' }
const textStyle = { fontSize: '1rem', wordBreak: 'break-word' }
const inputRowStyle = {
    display: 'flex',
    gap: '0.5rem'
}
const inputStyle = {
    flex: 1,
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid #4d3e96',
    backgroundColor: '#2D1F60',
    color: 'white',
    fontSize: '1rem'
}
const sendBtnStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#6C5CE7',
    color: 'white',
    fontSize: '1rem',
    cursor: 'pointer'
}

export default ChatView
