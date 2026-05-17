// Performance-demo API — bulk seed, naive stats, optimised stats, cache clear.
import { apiFetch } from './apiFetch'

/** Bulk-seed the DB.  body: { events: number } */
export async function bulkSeed(events = 1000) {
    const res = await apiFetch('/faker/bulk-seed', {
        method: 'POST',
        body: JSON.stringify({ events })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Seed failed')
    return data   // { message, events, eventDates, tickets, elapsedSec }
}

/** Run the naive (no-cache) heavy stats query. */
export async function runNaiveStats() {
    const t0  = performance.now()
    const res = await apiFetch('/stats/naive')
    const ms  = Math.round(performance.now() - t0)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Query failed')
    return { ...data, clientMs: ms }
}

/** Run the optimised (cache-first) heavy stats query. */
export async function runOptimisedStats() {
    const t0  = performance.now()
    const res = await apiFetch('/stats/optimised')
    const ms  = Math.round(performance.now() - t0)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Query failed')
    return { ...data, clientMs: ms }
}

/** Wipe the server-side in-memory cache. */
export async function clearStatsCache() {
    const res = await apiFetch('/stats/cache/clear', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Clear failed')
    return data
}

/** Start the real-time faker loop. */
export async function startFaker() {
    const res = await apiFetch('/faker/start', { method: 'POST' })
    return res.json()
}

/** Stop the real-time faker loop. */
export async function stopFaker() {
    const res = await apiFetch('/faker/stop', { method: 'POST' })
    return res.json()
}

/** Run all suspicious-behaviour simulation scenarios. */
export async function runSimulation() {
    const res = await apiFetch('/faker/simulate', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Simulation failed')
    return data
}
