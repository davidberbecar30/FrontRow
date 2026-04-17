import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEvents } from '../api/eventsAPI.js'
import styles from './FavoritesView.module.css'
import Header from '../components/Header.jsx'
import EventCard from '../components/EventCard.jsx'

function FavoritesView() {
    const navigate = useNavigate()
    const [favorites, setFavorites] = useState([])
    const [activeFilter, setActiveFilter] = useState('All')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const categoryMap = {
        'All': null,
        'Concerts': 'Concert',
        'Sports': 'Sports',
        'Magic': 'Magic'
    }

    async function loadFavorites() {
        try {
            setLoading(true)
            const data = await getEvents({ limit: 100 })
            const favorited = data.data.filter(e => e.favorited)
            setFavorites(favorited)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadFavorites()
    }, [])

    const filtered = activeFilter === 'All'
        ? favorites
        : favorites.filter(e => e.category === categoryMap[activeFilter])

    const categories = ['All', 'Concerts', 'Sports', 'Magic']

    if (loading) return <p style={{ padding: '40px', color: '#6C5CE7' }}>Loading...</p>
    if (error) return <p style={{ padding: '40px', color: '#FF7675' }}>{error}</p>

    return (
        <div className={styles.page}>
            <Header />
            <div className={styles.content}>
                <div className={styles.titleRow}>
                    <h1 className={styles.title}>MY FAVORITES</h1>
                    <div className={styles.countBadge}>
                        <span className={styles.countText}>{favorites.length}</span>
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
                                onFavoriteToggle={loadFavorites}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default FavoritesView