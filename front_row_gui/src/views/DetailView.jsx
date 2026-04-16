import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEventById, deleteEvent, toggleFavorite } from '../events/evetsList.js'
import Header from '../components/Header.jsx'
import styles from './DetailView.module.css'

function DetailView() {
    const { id } = useParams()
    const navigate = useNavigate()
    const event = getEventById(Number(id))

    const [quantities, setQuantities] = useState(
        event ? event.dates.map(() => 1) : []
    )
    const [, forceUpdate] = useState(0)


    if (!event) {
        return (
            <div className={styles.page}>
                <Header />
                <p style={{ padding: '40px', color: '#6C5CE7', fontSize: '24px' }}>
                    Event not found.
                </p>
            </div>
        )
    }

    function handleDelete() {
        deleteEvent(event.id)
        navigate('/events')
    }

    function handleFavorite() {
        toggleFavorite(event.id)
        forceUpdate(n => n + 1)
    }

    function incrementQty(index) {
        setQuantities(prev => prev.map((q, i) => i === index ? q + 1 : q))
    }

    function decrementQty(index) {
        setQuantities(prev => prev.map((q, i) => i === index ? Math.max(1, q - 1) : q))
    }

    return (
        <div className={styles.page}>
            <Header />

            <div className={styles.content}>

                {/* LEFT — Gallery */}
                <div className={styles.gallery}>
                    <img
                        className={styles.galleryImg}
                        src={event.image}
                        alt={event.title}
                    />
                </div>

                {/* RIGHT — Details */}
                <div className={styles.details}>

                    {/* Title + Favorite */}
                    <div className={styles.titleRow}>
                        <h1 className={styles.title}>{event.title}</h1>
                        <button className={styles.favoriteBtn} onClick={handleFavorite}>
                            {event.favorited ? '❤️' : '🤍'}
                        </button>
                    </div>

                    {/* Description */}
                    <p className={styles.description}>{event.description}</p>

                    {/* Admin Actions */}
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

                    {/* Date Rows */}
                    <div className={styles.datesFrame}>
                        {event.dates.map((dateObj, index) => (
                            <div key={index} className={styles.eventDetailRow}>

                                {/* Date + Location */}
                                <div className={styles.detailCell}>
                                    <p className={styles.detailText}>
                                        {dateObj.date}{'\n'}{dateObj.venue},{'\n'}{dateObj.location}
                                    </p>
                                </div>

                                {/* Available Tickets */}
                                <div className={styles.detailCell}>
                                    <p className={styles.detailText}>
                                        Available Tickets:{'\n'}{event.availableTickets}
                                    </p>
                                </div>

                                {/* Section */}
                                <div className={styles.detailCell}>
                                    <p className={styles.detailText}>
                                        Section{'\n'}Choose Section
                                    </p>
                                </div>

                                {/* Quantity */}
                                <div className={styles.quantityCell}>
                                    <button className={styles.quantityBtn} onClick={() => decrementQty(index)}>−</button>
                                    <span className={styles.quantityNum}>{quantities[index]}</span>
                                    <button className={styles.quantityBtn} onClick={() => incrementQty(index)}>+</button>
                                </div>

                                {/* Total */}
                                <div className={styles.totalCell}>
                                    <p className={styles.totalText}>
                                        Total{'\n'}${event.price * quantities[index]}
                                    </p>
                                </div>

                                {/* Buy Now */}
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