import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './MasterView.module.css'
import Header from "../components/Header.jsx"
import FilterComponent from "../components/FilterComponent.jsx"
import EventCard from "../components/EventCard.jsx"
import { getEvents } from '../api/eventsAPI.js'
import { getRecentlyViewed } from '../cookies/cookieManager.js'

const ITEMS_PER_PAGE = 4

function MasterView() {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [location, setLocation] = useState('')
    const [activeCategory, setActiveCategory] = useState('🔥 Hype')
    const [currentPage, setCurrentPage] = useState(1)
    const [events, setEvents] = useState([])
    const [totalPages, setTotalPages] = useState(1)
    const [recentlyViewed, setRecentlyViewed] = useState(getRecentlyViewed())
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // ─── Fetch events from API ─────────────────────────────
    useEffect(() => {
        async function loadEvents() {
            try {
                setLoading(true)
                const data = await getEvents({
                    page: currentPage,
                    limit: ITEMS_PER_PAGE,
                    search,
                })
                setEvents(data.data)
                setTotalPages(data.pagination.totalPages)
            } catch (err) {
                setError(err.message || 'Failed to load events')
            } finally {
                setLoading(false)
            }
        }
        loadEvents()
        setRecentlyViewed(getRecentlyViewed())
    }, [currentPage, search])

    const categories = ['🔥 Hype', '🧘 Chill', '💗 Date', '🏆 Sports']
    const picked = events.slice(0, 3)
    const matchScores = [98, 91, 87]

    return (
        <div className={styles.page}>
            <div>
                <Header />
            </div>

            <FilterComponent
                location={location}
                onLocationChange={setLocation}
                search={search}
                onSearchChange={(val) => {
                    setSearch(val)
                    setCurrentPage(1)
                }}
            />

            {loading && <p style={{ textAlign: 'center', color: '#6C5CE7' }}>Loading...</p>}
            {error && <p style={{ textAlign: 'center', color: '#FF7675' }}>{error}</p>}

            <div className={styles.pickedSection}>
                <div className={styles.pickedHeader}>
                    <h2 className={styles.pickedTitle}>🎭 Picked for you</h2>
                    <span className={styles.vibeMatchBadge}>Vibe Match</span>
                </div>
                <div className={styles.categoryPills}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={activeCategory === cat ? styles.pillActive : styles.pill}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className={styles.pickedCards}>
                    {picked.map((event, i) => (
                        <div
                            key={event.id}
                            className={styles.pickedCard}
                            onClick={() => navigate(`/events/${event.id}`)}
                        >
                            <img className={styles.pickedCardImg} src={event.image} alt={event.title} />
                            <div className={styles.pickedCardInfo}>
                                <p className={styles.pickedCardTitle}>{event.title}</p>
                                <p className={styles.pickedCardPrice}>${event.price}</p>
                                <p className={styles.pickedCardMatch}>{matchScores[i]}% Match</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.cardsSection}>
                <div className={styles.cardsGrid}>
                    {events.map(event => (
                        <EventCard
                            key={event.id}
                            event={event}
                            onFavoriteToggle={() => {}}
                        />
                    ))}
                </div>
            </div>

            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <div className={styles.paginationBox}>
                        <button className={styles.pageBtn} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>{'<'}</button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                className={currentPage === page ? styles.pageBtnActive : styles.pageBtn}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        ))}
                        <button className={styles.pageBtn} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>{'>'}</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MasterView