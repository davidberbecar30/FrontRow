import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEvents } from '../events/evetsList.js'
import styles from './MasterView.module.css'
import Header from "../components/Header.jsx";
import FilterComponent from "../components/FilterComponent.jsx";
import EventCard from "../components/EventCard.jsx";

const ITEMS_PER_PAGE = 4

function MasterView() {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [location, setLocation] = useState('')
    const [activeCategory, setActiveCategory] = useState('🔥 Hype')
    const [currentPage, setCurrentPage] = useState(1)
    const [, forceUpdate] = useState(0)

    const events = getEvents()

    const filtered = events.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase())
    )

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
    const paginated = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    const categories = ['🔥 Hype', '🧘 Chill', '💗 Date', '🏆 Sports']
    const picked = events.slice(0, 3)
    const matchScores = [98, 91, 87]

    return (
        <div className={styles.page}>
            <div>
                <Header/>
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
                    {paginated.map(event => (
                        <EventCard
                            key={event.id}
                            event={event}
                            onFavoriteToggle={() => forceUpdate(n => n + 1)}
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