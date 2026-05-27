import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { getMyTickets } from '../api/eventsAPI.js'
import styles from './MyTicketsView.module.css'

function MyTicketsView() {
    const navigate = useNavigate()
    const [purchases, setPurchases] = useState([])
    const [loading, setLoading]     = useState(true)
    const [error, setError]         = useState(null)

    useEffect(() => {
        getMyTickets()
            .then(data => setPurchases(data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className={styles.page}>
            <Header />
            <div className={styles.content}>
                <h1 className={styles.title}>My Tickets</h1>
                <p className={styles.subtitle}>All tickets purchased on your account</p>

                {loading && <p className={styles.state}>Loading...</p>}
                {error   && <p className={styles.stateError}>{error}</p>}

                {!loading && !error && purchases.length === 0 && (
                    <div className={styles.empty}>
                        <p>You have no tickets yet.</p>
                        <button className={styles.browseBtn} onClick={() => navigate('/events')}>
                            Browse Events
                        </button>
                    </div>
                )}

                <div className={styles.list}>
                    {purchases.map(p => {
                        const ev     = p.event
                        const date   = ev?.dates?.[0]
                        const total  = (Number(p.unitPrice) * p.quantity).toFixed(2)
                        const bought = new Date(p.createdAt).toLocaleDateString()

                        return (
                            <div key={p.id} className={styles.card} onClick={() => navigate(`/events/${ev.id}`)}>
                                {ev.image && (
                                    <img src={ev.image} alt={ev.title} className={styles.image} />
                                )}
                                <div className={styles.info}>
                                    <h2 className={styles.eventTitle}>{ev.title}</h2>
                                    {date && (
                                        <p className={styles.meta}>{date.venue} &middot; {date.location} &middot; {date.date}</p>
                                    )}
                                    <div className={styles.tags}>
                                        <span className={styles.tag}>{p.quantity} ticket{p.quantity > 1 ? 's' : ''}</span>
                                        <span className={styles.tag}>${total} total</span>
                                        <span className={styles.tagGray}>Purchased {bought}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default MyTicketsView
