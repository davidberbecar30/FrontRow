/**
 * statsRepository.js
 *
 * Contains ONE query in two forms:
 *
 *  heavyStatsRaw()  — naive, no hints, no caching.  Used to demonstrate the
 *                     slow baseline that succumbs to load.
 *
 * The query is intentionally many-to-many heavy:
 *
 *   event_dates (venue) ──< events (category) ──< tickets (status, price)
 *
 * For every (venue × category) pair it computes:
 *   • how many distinct events were hosted
 *   • total / available / sold ticket counts
 *   • average & total revenue potential
 *   • sell-through percentage
 *
 * This forces a triple-join + GROUP BY + multiple aggregates across up to
 * tens-of-thousands of rows — exactly the shape JMeter will expose as a
 * bottleneck without optimisation.
 */

const sequelize = require('../db')

const HEAVY_SQL = `
SELECT
    ed.venue,
    e.category,
    COUNT(DISTINCT e.id)                                                    AS event_count,
    COUNT(t.id)                                                             AS total_tickets,
    SUM(CASE WHEN t.status = 'available' THEN 1 ELSE 0 END)                AS available_tickets,
    SUM(CASE WHEN t.status = 'sold'      THEN 1 ELSE 0 END)                AS sold_tickets,
    SUM(CASE WHEN t.status = 'reserved'  THEN 1 ELSE 0 END)                AS reserved_tickets,
    ROUND(AVG(t.price)::numeric, 2)                                         AS avg_price,
    ROUND(SUM(t.price)::numeric, 2)                                         AS total_revenue_potential,
    ROUND(
        (SUM(CASE WHEN t.status = 'sold' THEN 1 ELSE 0 END)::numeric
         / NULLIF(COUNT(t.id), 0)) * 100
    , 2)                                                                    AS sell_through_pct
FROM event_dates ed
JOIN   events  e ON ed."eventId" = e.id
LEFT JOIN tickets t ON t."eventId" = e.id
GROUP  BY ed.venue, e.category
ORDER  BY total_revenue_potential DESC NULLS LAST
`

/**
 * Run the heavy aggregation directly against the DB — no cache, no shortcuts.
 * Returns { rows, queryMs }.
 */
async function heavyStatsRaw() {
    const t0 = Date.now()
    const [rows] = await sequelize.query(HEAVY_SQL)
    const queryMs = Date.now() - t0
    return { rows, queryMs }
}

module.exports = { heavyStatsRaw }
