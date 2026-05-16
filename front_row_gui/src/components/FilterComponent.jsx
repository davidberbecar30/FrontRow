import styles from './FilterComponent.module.css'
import calendarSGV from '../assets/calendar_month_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import searchSVG from '../assets/search_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import locationSVG from '../assets/location_on_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
function FilterComponent({ location, onLocationChange, search, onSearchChange }) {
    return (
        <div className={styles.filterDiv}>
            <div className={styles.filterFrame}>

                <div className={styles.locationFrame}>
                    <div className={styles.locationIcon}>
                        <img src={locationSVG}></img>
                    </div>
                    <div className={styles.contentWrapper}>
                        <p className={styles.locationLabel}>Location</p>
                        <input
                            className={styles.locationInput}
                            type="text"
                            placeholder="Country, City, Zip Code"
                            value={location}
                            onChange={e => onLocationChange(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.datesFrame}>
                    <div className={styles.datesIcon}>
                        <img src={calendarSGV}></img>
                    </div>
                    <div className={styles.contentWrapper}>
                        <p className={styles.datesLabel}>Dates</p>
                        <input
                            className={styles.datesInput}
                            type="date"
                            placeholder="All dates"
                        />
                    </div>
                </div>

                <div className={styles.searchFrame}>
                    <div className={styles.searchIcon}>
                        <img src={searchSVG}></img>
                    </div>
                    <div className={styles.contentWrapper}>
                        <p className={styles.searchLabel}>Search</p>
                        <input
                            className={styles.searchInput}
                            type="text"
                            placeholder="Artist, Event, Category"
                            value={search}
                            onChange={e => onSearchChange(e.target.value)}
                        />
                    </div>
                </div>

            </div>
        </div>
    )
}

export default FilterComponent