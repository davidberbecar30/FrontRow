import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './MasterView.module.css'
import Header from "../components/Header.jsx"
import FilterComponent from "../components/FilterComponent.jsx"
import EventCard from "../components/EventCard.jsx"
import { getEvents } from '../api/eventsAPI.js'
import { getRecentlyViewed } from '../cookies/cookieManager.js'
import { useWebSocket } from '../hooks/useWebSocket.js'

const ITEMS_PER_PAGE = 4

function MasterView() {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [location, setLocation] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [activeCategory, setActiveCategory] = useState('🔥 Hype')
    const [pickedEvents, setPickedEvents] = useState([])
    const [events, setEvents] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [recentlyViewed, setRecentlyViewed] = useState(getRecentlyViewed())
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [hasMore, setHasMore] = useState(true)

    // ─── Prefetch cache ────────────────────────────────────
    const prefetchCache = useRef({})

    const filters = { search, location, dateFrom, dateTo }
    const filterKey = `${search}|${location}|${dateFrom}|${dateTo}`

    // ─── Fetch a specific page ─────────────────────────────
    async function fetchPage(page, f) {
        const cacheKey = `${page}-${f.search}|${f.location}|${f.dateFrom}|${f.dateTo}`
        if (prefetchCache.current[cacheKey]) return prefetchCache.current[cacheKey]
        const data = await getEvents({ page, limit: ITEMS_PER_PAGE, ...f })
        prefetchCache.current[cacheKey] = data
        return data
    }

    // ─── Prefetch next page in background ─────────────────
    async function prefetchPage(page, f) {
        const cacheKey = `${page}-${f.search}|${f.location}|${f.dateFrom}|${f.dateTo}`
        if (prefetchCache.current[cacheKey]) return
        try {
            const data = await getEvents({ page, limit: ITEMS_PER_PAGE, ...f })
            prefetchCache.current[cacheKey] = data
        } catch (err) {
            console.error('Prefetch failed:', err)
        }
    }

    // ─── Load initial page ─────────────────────────────────
    const loadInitial = useCallback(async () => {
        try {
            setLoading(true)
            setEvents([])
            setCurrentPage(1)
            prefetchCache.current = {}

            const data = await fetchPage(1, filters)
            setEvents(data.data)
            setTotalPages(data.pagination.totalPages)
            setHasMore(data.pagination.totalPages > 1)

            if (data.pagination.totalPages > 1) prefetchPage(2, filters)
        } catch (err) {
            setError(err.message || 'Failed to load events')
        } finally {
            setLoading(false)
        }
    }, [filterKey])

    // ─── Load next page (append) ───────────────────────────
    const loadNextPage = useCallback(async () => {
        if (loading || !hasMore) return

        const nextPage = currentPage + 1
        if (nextPage > totalPages) { setHasMore(false); return }

        try {
            setLoading(true)
            const data = await fetchPage(nextPage, filters)
            setEvents(prev => [...prev, ...data.data])
            setCurrentPage(nextPage)
            setHasMore(nextPage < data.pagination.totalPages)
            if (nextPage + 1 <= data.pagination.totalPages) prefetchPage(nextPage + 1, filters)
        } catch (err) {
            setError(err.message || 'Failed to load more events')
        } finally {
            setLoading(false)
        }
    }, [loading, hasMore, currentPage, totalPages, filterKey])

    // ─── Scroll detection ──────────────────────────────────
    useEffect(() => {
        function handleScroll() {
            const nearBottom =
                window.scrollY + window.innerHeight >= document.body.scrollHeight - 300
            if (nearBottom && !loading && hasMore) {
                loadNextPage()
            }
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [loading, hasMore, loadNextPage])

    // ─── Load on mount and search change ──────────────────
    useEffect(() => {
        loadInitial()
        setRecentlyViewed(getRecentlyViewed())
    }, [loadInitial])

    // ─── Picked for you — fetch top 3 by price per pill ───
    const PILL_CATEGORY_MAP = {
        '🔥 Hype':    null,       // all categories
        '🧘 Chill':   'Festival',
        '💗 Date':    'Theater',
        '🏆 Sports':  'Sports'
    }

    useEffect(() => {
        async function fetchPicked() {
            try {
                const category = PILL_CATEGORY_MAP[activeCategory]
                const data = await getEvents({ limit: 3, sort: 'price_desc', category: category || '' })
                setPickedEvents(data.data || [])
            } catch {}
        }
        fetchPicked()
    }, [activeCategory])

    // ─── WebSocket ─────────────────────────────────────────
    useWebSocket((message) => {
        if (message.type === 'NEW_EVENT') {
            console.log('New event received:', message.data.title)
            loadInitial()
        }
    })

    const categories = ['🔥 Hype', '🧘 Chill', '💗 Date', '🏆 Sports']
    const matchScores = [98, 91, 87]

    return (
        <div className={styles.page}>
            <div>
                <Header />
            </div>

            <FilterComponent
                location={location}
                onLocationChange={setLocation}
                dateFrom={dateFrom}
                onDateFromChange={setDateFrom}
                dateTo={dateTo}
                onDateToChange={setDateTo}
                search={search}
                onSearchChange={setSearch}
                onClear={() => {
                    setSearch('')
                    setLocation('')
                    setDateFrom('')
                    setDateTo('')
                }}
            />

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
                    {pickedEvents.map((event, i) => (
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
                            onFavoriteToggle={loadInitial}
                        />
                    ))}
                </div>
            </div>

            {/* ─── Loading indicator ─── */}
            {loading && (
                <p style={{ textAlign: 'center', color: '#6C5CE7', padding: '20px' }}>
                    Loading more events...
                </p>
            )}

            {/* ─── End of list ─── */}
            {!hasMore && events.length > 0 && (
                <p style={{ textAlign: 'center', color: '#9988BB', padding: '20px' }}>
                    You've seen all events!
                </p>
            )}
        </div>
    )
}

export default MasterView