/**
 * statsService.js
 *
 * Exposes two paths to the same heavy statistic:
 *
 *   getNaiveStats()     — always hits the DB, no cache.
 *                         Baseline for JMeter "before" measurement.
 *
 *   getOptimisedStats() — DB indices in place + 60-second in-memory cache.
 *                         "After" measurement.  Under sustained load every
 *                         request after the first one is served from memory
 *                         in < 1 ms, making the endpoint DDoS-resistant.
 *
 * Cache design
 * ────────────
 * A plain Map keyed by cache-key string with a { data, expiresAt } value.
 * No external dependency needed.  TTL is configurable via STATS_CACHE_TTL_MS.
 * Call clearCache() to force a fresh DB hit on the next request (useful for
 * testing or after a bulk seed).
 */

const { heavyStatsRaw } = require('../repository/statsRepository')

// ── Simple TTL cache ─────────────────────────────────────────────────────────

const CACHE_KEY    = 'heavy-stats'
const CACHE_TTL_MS = Number(process.env.STATS_CACHE_TTL_MS) || 60_000   // 60 s default

const _cache = new Map()

function cacheGet(key) {
    const entry = _cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
        _cache.delete(key)
        return null
    }
    return entry.data
}

function cacheSet(key, data, ttlMs) {
    _cache.set(key, { data, expiresAt: Date.now() + ttlMs })
}

function clearCache() {
    _cache.clear()
}

// ── Service methods ──────────────────────────────────────────────────────────

/**
 * Naive path: no cache, no query hints.
 * Every request re-runs the full triple-join aggregation.
 */
async function getNaiveStats() {
    const { rows, queryMs } = await heavyStatsRaw()
    return {
        source:  'database (naive — no cache)',
        queryMs,
        count:   rows.length,
        data:    rows
    }
}

/**
 * Optimised path: cache-first, DB on miss.
 * With indices already in place, cache misses are fast too.
 * Cache hits are sub-millisecond regardless of data volume.
 */
async function getOptimisedStats() {
    const cached = cacheGet(CACHE_KEY)
    if (cached) {
        return {
            source:  'cache (in-memory, TTL 60 s)',
            queryMs: 0,
            count:   cached.count,
            data:    cached.data,
            cachedAt: cached.cachedAt
        }
    }

    const { rows, queryMs } = await heavyStatsRaw()
    const payload = { count: rows.length, data: rows, cachedAt: new Date().toISOString() }
    cacheSet(CACHE_KEY, payload, CACHE_TTL_MS)

    return {
        source:  'database (optimised — indices + cache)',
        queryMs,
        count:   rows.length,
        data:    rows,
        cachedAt: payload.cachedAt
    }
}

module.exports = { getNaiveStats, getOptimisedStats, clearCache }
