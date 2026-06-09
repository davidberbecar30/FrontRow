import styles from './FilterComponent.module.css'
import calendarSVG  from '../assets/calendar_month_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import searchSVG    from '../assets/search_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import locationSVG  from '../assets/location_on_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'

function FilterComponent({
    location, onLocationChange,
    dateFrom, onDateFromChange,
    dateTo,   onDateToChange,
    search,   onSearchChange,
    onClear
}) {
    const hasFilters = search || location || dateFrom || dateTo

    return (
        <div className={styles.filterDiv}>
            <div className={styles.filterFrame}>

                {/* Location */}
                <div className={styles.filterBox}>
                    <div className={styles.iconWrap}>
                        <img src={locationSVG} alt="Location" />
                    </div>
                    <div className={styles.contentWrapper}>
                        <p className={styles.filterLabel}>Location</p>
                        <input
                            className={styles.filterInput}
                            type="text"
                            placeholder="City, Country, Zip Code"
                            value={location}
                            onChange={e => onLocationChange(e.target.value)}
                        />
                    </div>
                </div>

                {/* Date range */}
                <div className={styles.filterBox}>
                    <div className={styles.iconWrap}>
                        <img src={calendarSVG} alt="Dates" />
                    </div>
                    <div className={styles.contentWrapper}>
                        <p className={styles.filterLabel}>Dates</p>
                        <div className={styles.dateRange}>
                            <div className={styles.dateField}>
                                <span className={styles.dateSubLabel}>From</span>
                                <input
                                    className={styles.dateInput}
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => onDateFromChange(e.target.value)}
                                />
                            </div>
                            <div className={styles.dateSep} />
                            <div className={styles.dateField}>
                                <span className={styles.dateSubLabel}>To</span>
                                <input
                                    className={styles.dateInput}
                                    type="date"
                                    value={dateTo}
                                    min={dateFrom || undefined}
                                    onChange={e => onDateToChange(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className={styles.filterBox}>
                    <div className={styles.iconWrap}>
                        <img src={searchSVG} alt="Search" />
                    </div>
                    <div className={styles.contentWrapper}>
                        <p className={styles.filterLabel}>Search</p>
                        <input
                            className={styles.filterInput}
                            type="text"
                            placeholder="Artist, Event, Category"
                            value={search}
                            onChange={e => onSearchChange(e.target.value)}
                        />
                    </div>
                </div>

            </div>

            {/* Clear filters button — only visible when a filter is active */}
            {hasFilters && onClear && (
                <button className={styles.clearBtn} onClick={onClear}>
                    Clear filters
                </button>
            )}
        </div>
    )
}

export default FilterComponent
