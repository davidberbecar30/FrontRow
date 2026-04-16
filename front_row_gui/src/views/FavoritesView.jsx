import styles from './FavoritesView.module.css'
import Header from '../components/Header.jsx'
import EventCard from '../components/EventCard.jsx'
import { getEvents } from '../events/evetsList.js'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function FavoritesView() {
    const navigate = useNavigate()
    const [activeFilter, setActiveFilter] = useState('All')
    const [, forceUpdate] = useState(0)

    const allFavorites = getEvents().filter(e => e.favorited)


    const categories = ['All', 'Concerts', 'Sports', 'Magic']

    const filtered = activeFilter === 'All'
        ? allFavorites
        : allFavorites.filter(e => e.category === activeFilter)

    return (
        <div className={styles.page}>
            <Header />

            <div className={styles.content}>
                <div className={styles.titleRow}>
                    <h1 className={styles.title}>MY FAVORITES</h1>
                    <div className={styles.countBadge}>
                        <span className={styles.countText}>{allFavorites.length}</span>
                    </div>
                </div>

                <div className={styles.filterRow}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={activeFilter === cat ? styles.pillActive : styles.pill}
                            onClick={() => setActiveFilter(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {filtered.length === 0 ? (
                    <p className={styles.empty}>No favorites yet. Start adding some! ❤️</p>
                ) : (
                    <div className={styles.cardsGrid}>
                        {filtered.map(event => (
                            <EventCard
                                key={event.id}
                                event={event}
                                onFavoriteToggle={() => forceUpdate(n => n + 1)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default FavoritesView