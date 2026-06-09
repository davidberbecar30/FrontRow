import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { isAdmin } from '../auth/currentUser'
import { getRevenue } from '../api/adminAPI'

function AdminRevenueView() {
    const navigate = useNavigate()
    const [revenue, setRevenue]     = useState(null)
    const [loading, setLoading]     = useState(true)
    const [error, setError]         = useState(null)

    useEffect(() => {
        if (!isAdmin()) { navigate('/events'); return }
        load()
    }, [])

    async function load() {
        setLoading(true)
        setError(null)
        try {
            const data = await getRevenue()
            setRevenue(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    function formatTime(iso) {
        return new Date(iso).toLocaleString()
    }

    if (!isAdmin()) return null

    return (
        <div style={{ backgroundColor: '#1A0F3F', minHeight: '100vh' }}>
            <Header />
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>Revenue</h2>
                    <button onClick={load} style={btn}>Refresh</button>
                </div>
                <p style={{ color: '#9988BB', marginTop: '0.5rem' }}>
                    All ticket purchases made on the platform.
                </p>

                {error && (
                    <div style={{ background: '#FF7675', padding: '0.75rem 1rem', borderRadius: 6, marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <p style={{ color: '#9988BB' }}>Loading...</p>
                ) : revenue && (
                    <>
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
    )
}

const th = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.9rem', color: '#fff' }
const td = { padding: '0.75rem 1rem', fontSize: '0.95rem' }
const btn = { padding: '0.5rem 1rem', borderRadius: 6, border: 'none', backgroundColor: '#6C5CE7', color: 'white', cursor: 'pointer' }
const summaryCard = { background: '#2D1F60', borderRadius: 8, padding: '1rem 1.5rem', minWidth: 140 }
const summaryLabel = { margin: 0, color: '#9988BB', fontSize: '0.85rem' }
const summaryValue = { margin: '0.25rem 0 0', fontSize: '1.6rem', fontWeight: 700, color: '#A29BFE' }

export default AdminRevenueView
