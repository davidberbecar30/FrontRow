import styles from './EventCard.module.css'
import { useNavigate } from 'react-router-dom'
import {toggleFavorite} from "../events/evetsList.js";
import {addRecentlyViewed, trackCategoryClick} from "../cookies/cookieManager.js";

function EventCard({ event, onFavoriteToggle }) {

    const navigate = useNavigate()
    function handleFavorite(e) {
        e.stopPropagation();
        const updated = toggleFavorite(event.id);
        if (updated) onFavoriteToggle?.(updated);
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
                {event.favorited===true ? '❤️' : '🤍'}
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