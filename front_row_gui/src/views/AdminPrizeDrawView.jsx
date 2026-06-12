import { useState, useEffect } from 'react'
import Header from '../components/Header.jsx'
import { apiFetch } from '../api/apiFetch'
import { startDraw, listDraws } from '../api/prizeDrawAPI'
import styles from './AdminPrizeDrawView.module.css'

function AdminPrizeDrawView() {
    const [events,   setEvents]   = useState([])
    const [draws,    setDraws]    = useState([])
    const [loading,  setLoading]  = useState(false)
    const [success,  setSuccess]  = useState(null)
    const [error,    setError]    = useState(null)

    const [form, setForm] = useState({
        eventId:         '',
        eventDateId:     '',
        prizeDescription: '',
        durationHours:   1
    })

    useEffect(() => {
        // Load all events for the picker
        apiFetch('/events?limit=100')
            .then(r => r.json())
            .then(d => setEvents(d.rows || d.events || []))
            .catch(() => {})

        loadDraws()
    }, [])

    async function loadDraws() {
        try {
            const data = await listDraws()
            setDraws(data)
        } catch { /* ignore */ }
    }

    const selectedEvent = events.find(e => String(e.id) === String(form.eventId))

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)
        try {
            await startDraw({
                eventId:          Number(form.eventId),
                eventDateId:      Number(form.eventDateId),
                prizeDescription: form.prizeDescription,
                durationHours:    Number(form.durationHours)
            })
            setSuccess('Draw started! Users will see the opt-in popup right away.')
            setForm({ eventId: '', eventDateId: '', prizeDescription: '', durationHours: 1 })
            loadDraws()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    function fmtDate(iso) {
        return iso ? new Date(iso).toLocaleString() : '—'
    }

    return (
        <div className={styles.page}>
            <Header />
            <div className={styles.content}>
                <h1 className={styles.pageTitle}>Prize Draw</h1>
                <p className={styles.subtitle}>Start a draw — a free ticket to any event. All logged-in users get an opt-in popup instantly via WebSocket.</p>

                {/* ── Start form ─────────────────────────────────────── */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>New Draw</h2>
                    <form className={styles.form} onSubmit={handleSubmit}>

                        {/* Event picker */}
                        <label className={styles.label}>Event</label>
                        <select
                            className={styles.select}
                            value={form.eventId}
                            onChange={e => setForm(f => ({ ...f, eventId: e.target.value, eventDateId: '' }))}
                            required
                        >
                            <option value="">— Select event —</option>
                            {events.map(ev => (
                                <option key={ev.id} value={ev.id}>{ev.title}</option>
                            ))}
                        </select>

                        {/* Date picker (filtered to selected event) */}
                        <label className={styles.label}>Date</label>
                        <select
                            className={styles.select}
                            value={form.eventDateId}
                            onChange={e => setForm(f => ({ ...f, eventDateId: e.target.value }))}
                            required
                            disabled={!selectedEvent}
                        >
                            <option value="">— Select date —</option>
                            {(selectedEvent?.dates || []).map(d => (
                                <option key={d.id} value={d.id}>
                                    {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                                    {d.venue ? ` · ${d.venue}` : ''}
                                    {d.location ? `, ${d.location}` : ''}
                                </option>
                            ))}
                        </select>

                        {/* Prize description */}
                        <label className={styles.label}>Prize description</label>
                        <input
                            className={styles.input}
                            type="text"
                            placeholder="e.g. 1 × VIP ticket (value $120)"
                            value={form.prizeDescription}
                            onChange={e => setForm(f => ({ ...f, prizeDescription: e.target.value }))}
                            required
                        />

                        {/* Duration */}
                        <label className={styles.label}>Opt-in window (hours)</label>
                        <input
                            className={styles.input}
                            type="number"
                            min="0.05"
                            step="0.05"
                            placeholder="e.g. 24"
                            value={form.durationHours}
                            onChange={e => setForm(f => ({ ...f, durationHours: e.target.value }))}
                            required
                        />

                        {error   && <p className={styles.error}>{error}</p>}
                        {success && <p className={styles.success}>{success}</p>}

                        <button className={styles.submitBtn} type="submit" disabled={loading}>
                            {loading ? 'Starting…' : '🎰 Start Draw'}
                        </button>
                    </form>
                </div>

                {/* ── History ───────────────────────────────────────── */}
                {draws.length > 0 && (
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Draw History</h2>
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Status</th>
                                        <th>Prize</th>
                                        <th>Duration</th>
                                        <th>Ends at</th>
                                        <th>Winner ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {draws.map(d => (
                                        <tr key={d.id}>
                                            <td>{d.id}</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${styles[`status_${d.status}`]}`}>
                                                    {d.status}
                                                </span>
                                            </td>
                                            <td>{d.prizeDescription}</td>
                                            <td>{d.durationHours}h</td>
                                            <td>{fmtDate(d.endsAt)}</td>
                                            <td>{d.winnerId || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminPrizeDrawView
