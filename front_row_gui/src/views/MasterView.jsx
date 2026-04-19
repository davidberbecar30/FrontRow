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
    const [activeCategory, setActiveCategory] = useState('🔥 Hype')
    const [events, setEvents] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [recentlyViewed, setRecentlyViewed] = useState(getRecentlyViewed())
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [hasMore, setHasMore] = useState(true)

    // ─── Prefetch cache ────────────────────────────────────
    const prefetchCache = useRef({})

    // ─── Fetch a specific page ─────────────────────────────
    async function fetchPage(page, search) {
        // check cache first
        const cacheKey = `${page}-${search}`
        if (prefetchCache.current[cacheKey]) {
            console.log(`Cache hit for page ${page}`)
            return prefetchCache.current[cacheKey]
        }

        const data = await getEvents({
            page,
            limit: ITEMS_PER_PAGE,
            search,
        })

        // save to cache
        prefetchCache.current[cacheKey] = data
        return data
    }

    // ─── Prefetch next page in background ─────────────────
    async function prefetchPage(page, search) {
        const cacheKey = `${page}-${search}`
        if (prefetchCache.current[cacheKey]) return // already cached
        console.log(`Prefetching page ${page}`)
        try {
            const data = await getEvents({
                page,
                limit: ITEMS_PER_PAGE,
                search,
            })
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
            prefetchCache.current = {} // clear cache on search change

            const data = await fetchPage(1, search)
            setEvents(data.data)
            setTotalPages(data.pagination.totalPages)
            setHasMore(data.pagination.totalPages > 1)

            // prefetch page 2 in background
            if (data.pagination.totalPages > 1) {
                prefetchPage(2, search)
            }
        } catch (err) {
            setError(err.message || 'Failed to load events')
        } finally {
            setLoading(false)
        }
    }, [search])

    // ─── Load next page (append) ───────────────────────────
    const loadNextPage = useCallback(async () => {
        if (loading || !hasMore) return

        const nextPage = currentPage + 1
        if (nextPage > totalPages) {
            setHasMore(false)
            return
        }

        try {
            setLoading(true)
            const data = await fetchPage(nextPage, search)
            setEvents(prev => [...prev, ...data.data]) // 👈 append not replace
            setCurrentPage(nextPage)
            setHasMore(nextPage < data.pagination.totalPages)

            // prefetch the page after next
            if (nextPage + 1 <= data.pagination.totalPages) {
                prefetchPage(nextPage + 1, search)
            }
        } catch (err) {
            setError(err.message || 'Failed to load more events')
        } finally {
            setLoading(false)
        }
    }, [loading, hasMore, currentPage, totalPages, search])

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

    // ─── WebSocket ─────────────────────────────────────────
    useWebSocket((message) => {
        if (message.type === 'NEW_EVENT') {
            console.log('New event received:', message.data.title)
            loadInitial()
        }
    })

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