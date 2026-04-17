import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEventById, deleteEvent, toggleFavorite } from '../api/eventsAPI.js'
import Header from '../components/Header.jsx'
import styles from './DetailView.module.css'

function DetailView() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [event, setEvent] = useState(null)
    const [quantities, setQuantities] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function loadEvent() {
            try {
                setLoading(true)
                const data = await getEventById(id)
                setEvent(data)
                setQuantities(data.dates.map(() => 1))
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        loadEvent()
    }, [id])

    async function handleDelete() {
        try {
            await deleteEvent(id)
            navigate('/events')
        } catch (err) {
            setError(err.message)
        }
    }

    async function handleFavorite() {
        try {
            const updated = await toggleFavorite(id)
            setEvent(updated)
        } catch (err) {
            setError(err.message)
        }
    }

    function incrementQty(index) {
        setQuantities(prev => prev.map((q, i) => i === index ? q + 1 : q))
    }

    function decrementQty(index) {
        setQuantities(prev => prev.map((q, i) => i === index ? Math.max(1, q - 1) : q))
    }

    if (loading) return <p style={{ padding: '40px', color: '#6C5CE7' }}>Loading...</p>
    if (error) return <p style={{ padding: '40px', color: '#FF7675' }}>{error}</p>
    if (!event) return null

    return (
        <div className={styles.page}>
            <Header />
            <div className={styles.content}>
                <div className={styles.gallery}>
                    <img className={styles.galleryImg} src={event.image} alt={event.title} />
                </div>
                <div className={styles.details}>
                    <div className={styles.titleRow}>
                        <h1 className={styles.title}>{event.title}</h1>
                        <button className={styles.favoriteBtn} onClick={handleFavorite}>
                            {event.favorited ? '❤️' : '🤍'}
                        </button>
                    </div>
                    <p className={styles.description}>{event.description}</p>
                    <div className={styles.adminActions}>
                        <button className={styles.deleteBtn} onClick={handleDelete}>
                            [Delete]
                        </button>
                        <button
                            className={styles.updateBtn}
                            onClick={() => navigate(`/events/${event.id}/edit`)}
                        >
                            [Update]
                        </button>
                    </div>
                    <div className={styles.datesFrame}>
                        {event.dates.map((dateObj, index) => (
                            <div key={index} className={styles.eventDetailRow}>
                                <div className={styles.detailCell}>
                                    <p className={styles.detailText}>
                                        {dateObj.date}{'\n'}{dateObj.venue},{'\n'}{dateObj.location}
                                    </p>
                                </div>
                                <div className={styles.detailCell}>
                                    <p className={styles.detailText}>
                                        Available Tickets:{'\n'}{event.availableTickets}
                                    </p>
                                </div>
                                <div className={styles.detailCell}>
                                    <p className={styles.detailText}>
                                        Section{'\n'}Choose Section
                                    </p>
                                </div>
                                <div className={styles.quantityCell}>
                                    <button className={styles.quantityBtn} onClick={() => decrementQty(index)}>−</button>
                                    <span className={styles.quantityNum}>{quantities[index]}</span>
                                    <button className={styles.quantityBtn} onClick={() => incrementQty(index)}>+</button>
                                </div>
                                <div className={styles.totalCell}>
                                    <p className={styles.totalText}>
                                        Total{'\n'}${event.price * quantities[index]}
                                    </p>
                                </div>
                                <button className={styles.buyBtn}>
                                    BUY NOW!
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DetailView