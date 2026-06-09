import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { isAdmin } from '../auth/currentUser'
import { getObservations, clearObservation, getRevenue } from '../api/adminAPI'

const POLL_INTERVAL_MS = 5_000   // re-check every 5 s while any obs are still "Generating…"

function AdminObservationsView() {
    const navigate = useNavigate()
    const [observations, setObservations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const pollRef = useRef(null)
    const pendingRef = useRef(false)

    const [revenue, setRevenue] = useState(null)
    const [revenueLoading, setRevenueLoading] = useState(true)
    const [revenueError, setRevenueError] = useState(null)

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
        loadRevenue()

        // Auto-poll while any observation has no aiNarrative yet
        pollRef.current = setInterval(() => {
            if (pendingRef.current) {
                load(true)
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

    async function loadRevenue() {
        setRevenueLoading(true)
        setRevenueError(null)
        try {
            const data = await getRevenue()
            setRevenue(data)
        } catch (err) {
            setRevenueError(err.message)
        } finally {
            setRevenueLoading(false)
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

                {/* ── Observations ── */}
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

                {/* ── Revenue ── */}
                <div style={{ marginTop: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0 }}>Revenue</h2>
                        <button onClick={loadRevenue} style={btn}>Refresh</button>
                    </div>
                    <p style={{ color: '#9988BB', marginTop: '0.5rem' }}>
                        All ticket purchases made on the platform.
                    </p>

                    {revenueError && (
                        <div style={{ background: '#FF7675', padding: '0.75rem 1rem', borderRadius: 6, marginBottom: '1rem' }}>
                            {revenueError}
                        </div>
                    )}

                    {revenueLoading ? (
                        <p style={{ color: '#9988BB' }}>Loading...</p>
                    ) : revenue && (
                        <>
                            {/* Summary cards */}
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={summaryCard}>
                                    <p style={summaryLabel}>Total Sales</p>
                                    <p style={summaryValue}>{revenue.totalPurchases}</p>
                                </div>
                                <div style={summaryCard}>
                                    <p style={summaryLabel}>Total Revenue</p>
                                    <p style={summaryValue}>${Number(revenue.totalRevenue).toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Recent purchases table */}
                            {revenue.recent.length === 0 ? (
                                <p style={{ color: '#9988BB' }}>No purchases yet.</p>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#2D1F60', borderRadius: 8, overflow: 'hidden' }}>
                                    <thead>
                                        <tr style={{ background: '#3D2A75' }}>
                                            <th style={th}>Customer</th>
                                            <th style={th}>Event</th>
                                            <th style={th}>Qty</th>
                                            <th style={th}>Total</th>
                                            <th style={th}>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {revenue.recent.map(p => (
                                            <tr key={p.id} style={{ borderTop: '1px solid #4d3e96' }}>
                                                <td style={td}>
                                                    {p.user
                                                        ? `${p.user.firstName} ${p.user.lastName}`
                                                        : `User #${p.userId}`}
                                                    <span style={{ display: 'block', fontSize: 11, color: '#9988BB' }}>
                                                        {p.user?.email}
                                                    </span>
                                                </td>
                                                <td style={td}>
                                                    {p.event?.title || `Event #${p.eventId}`}
                                                    <span style={{ display: 'block', fontSize: 11, color: '#9988BB' }}>
                                                        {p.event?.category}
                                                    </span>
                                                </td>
                                                <td style={td}>{p.quantity}</td>
                                                <td style={{ ...td, color: '#A29BFE', fontWeight: 600 }}>${p.total}</td>
                                                <td style={{ ...td, fontSize: '0.85rem' }}>{formatTime(p.purchasedAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}
                </div>

            </div>
        </div>
    )
}

const th = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.9rem', color: '#fff' }
const td = { padding: '0.75rem 1rem', fontSize: '0.95rem' }
const btn = { padding: '0.5rem 1rem', borderRadius: 6, border: 'none', backgroundColor: '#6C5CE7', color: 'white', cursor: 'pointer' }
const btnSmall = { ...btn, padding: '0.35rem 0.75rem', fontSize: '0.85rem' }
const summaryCard = { background: '#2D1F60', borderRadius: 8, padding: '1rem 1.5rem', minWidth: 140 }
const summaryLabel = { margin: 0, color: '#9988BB', fontSize: '0.85rem' }
const summaryValue = { margin: '0.25rem 0 0', fontSize: '1.6rem', fontWeight: 700, color: '#A29BFE' }

export default AdminObservationsView
