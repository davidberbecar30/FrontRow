import styles from './EventCard.module.css'
import { useNavigate } from 'react-router-dom'
import {toggleFavorite} from "../api/eventsAPI.js";
import {addRecentlyViewed, trackCategoryClick} from "../cookies/cookieManager.js";
import {useState} from "react";

function EventCard({ event, onFavoriteToggle }) {
    const navigate = useNavigate()
    const [favorited, setFavorited] = useState(event.favorited)  // 👈 local state

    async function handleFavorite(e) {
        e.stopPropagation()
        try {
            const updated = await toggleFavorite(event.id)
            setFavorited(updated.favorited)  // 👈 update local state immediately
            onFavoriteToggle?.()
        } catch (err) {
            console.error(err)
        }
    }

    function handleCardClick() {
        addRecentlyViewed(event)
        trackCategoryClick(event.category)
        navigate(`/events/${event.id}`)
    }

    const hasMultipleDates = event.dates.length > 1
    const firstDate = event.dates[0]

    return (
        <div className={styles.card} onClick={handleCardClick}>
            <div className={styles.imageWrapper}>
                <img className={styles.image} src={event.image} alt={event.title} />
            </div>
            <button className={styles.heart} onClick={handleFavorite}>
                {favorited ? '❤️' : '🤍'}  {/* 👈 use local state */}
            </button>
            <div className={styles.body}>
                <h3 className={styles.title}>{event.title}</h3>
                <p className={styles.metaLocation}>
                    {hasMultipleDates ? 'Multiple Locations' : `${firstDate.venue}, ${firstDate.location}`}
                </p>
                <p className={styles.metaDate}>
                    {hasMultipleDates ? `From ${firstDate.date}` : firstDate.date}
                </p>
                <p className={styles.metaAsLowAs}>As low as:</p>
                <p className={styles.price}>${event.price}</p>
            </div>
        </div>
    )
}

export default EventCard