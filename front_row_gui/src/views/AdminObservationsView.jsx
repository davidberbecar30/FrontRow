import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { isAdmin } from '../auth/currentUser'
import { getObservations, clearObservation } from '../api/adminAPI'

const POLL_INTERVAL_MS = 5_000   // re-check every 5 s while any obs are still "Generating…"

function AdminObservationsView() {
    const navigate = useNavigate()
    const [observations, setObservations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const pollRef = useRef(null)
    const pendingRef = useRef(false)   // ← ref avoids stale-closure in setInterval

    // Keep the ref in sync with the latest observations state
    useEffect(() => {
        pendingRef.current = observations.some(o => !o.aiNarrative)
    }, [observations])

    useEffect(() => {
        if (!isAdmin()) {
            navigate('/events')
            return
        }
        load()

        // Auto-poll while any observation has no aiNarrative yet
        pollRef.current = setInterval(() => {
            // Use ref instead of closure variable to avoid stale value
            if (pendingRef.current) {
                load(true)   // silent refresh — no loading spinner
            }
        }, POLL_INTERVAL_MS)

        return () => {
            if (pollRef.current) clearInterval(pollRef.current)
        }
    }, [])

    async function load(silent = false) {
        if (!silent) setLoading(true)
        setError(null)
        try {
            const data = await getObservations()
            setObservations(data)
        } catch (err) {
            setError(err.message)
        } finally {
            if (!silent) setLoading(false)
        }
    }

    async function handleClear(id) {
        try {
            await clearObservation(id)
            setObservations(prev => prev.filter(o => o.id !== id))
        } catch (err) {
            setError(err.message)
        }
    }

    function formatTime(iso) {
        return new Date(iso).toLocaleString()
    }

    if (!isAdmin()) return null

    const hasPendingNarratives = observations.some(o => !o.aiNarrative)

    return (
        <div style={{ backgroundColor: '#1A0F3F', minHeight: '100vh' }}>
            <Header />
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>Observation List</h2>
                    <button onClick={() => load()} style={btn}>Refresh</button>
                </div>

                <p style={{ color: '#9988BB', marginTop: '0.5rem' }}>
                    Users flagged by the malicious-behavior detector.
                </p>

                {hasPendingNarratives && (
                    <p style={{ color: '#A29BFE', fontSize: '0.85rem', fontStyle: 'italic' }}>
                        ⏳ AI analysis in progress for some observations…
                    </p>
                )}

                {error && (
                    <div style={{ background: '#FF7675', padding: '0.75rem 1rem', borderRadius: 6, marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <p style={{ color: '#9988BB' }}>Loading...</p>
                ) : observations.length === 0 ? (
                    <p style={{ color: '#9988BB' }}>No suspicious activity detected.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#2D1F60', borderRadius: 8, overflow: 'hidden' }}>
                        <thead>
                            <tr style={{ background: '#3D2A75' }}>
                                <th style={th}>User</th>
                                <th style={th}>Reason</th>
                                <th style={th}>AI Analysis</th>
                                <th style={th}>Flagged At</th>
                                <th style={th}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {observations.map(o => (
                                <tr key={o.id} style={{ borderTop: '1px solid #4d3e96' }}>
                                    <td style={td}>
                                        {o.user
                                            ? `${o.user.firstName} ${o.user.lastName} (${o.user.email})`
                                            : `User #${o.userId}`}
                                    </td>
                                    <td style={td}>{o.reason}</td>
                                    <td style={{ ...td, maxWidth: 280 }}>
                                        {o.aiNarrative ? (
                                            <span style={{
                                                display: 'block',
                                                background: '#1A0F3F',
                                                borderLeft: '3px solid #6C5CE7',
                                                padding: '0.4rem 0.6rem',
                                                borderRadius: 4,
                                                fontSize: 12,
                                                color: '#A29BFE',
                                                fontStyle: 'italic'
                                            }}>
                                                🤖 {o.aiNarrative}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#4d3e96', fontSize: 12 }}>
                                                Generating…
                                            </span>
                                        )}
                                    </td>
                                    <td style={td}>{formatTime(o.createdAt)}</td>
                                    <td style={td}>
                                        <button onClick={() => handleClear(o.id)} style={btnSmall}>
                                            Clear
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

const th = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.9rem', color: '#fff' }
const td = { padding: '0.75rem 1rem', fontSize: '0.95rem' }
const btn = { padding: '0.5rem 1rem', borderRadius: 6, border: 'none', backgroundColor: '#6C5CE7', color: 'white', cursor: 'pointer' }
const btnSmall = { ...btn, padding: '0.35rem 0.75rem', fontSize: '0.85rem' }

export default AdminObservationsView
