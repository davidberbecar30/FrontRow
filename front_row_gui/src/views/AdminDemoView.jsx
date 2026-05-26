import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { isAdmin } from '../auth/currentUser'
import { bulkSeed, runNaiveStats, runOptimisedStats, clearStatsCache, startFaker, stopFaker, runSimulation } from '../api/perfAPI'

// ── tiny helpers ──────────────────────────────────────────────────────────────

function Badge({ label, color = '#6C5CE7' }) {
    return (
        <span style={{
            display: 'inline-block', padding: '2px 10px', borderRadius: 20,
            background: color, fontSize: 12, fontWeight: 700, color: '#fff'
        }}>
            {label}
        </span>
    )
}

function Card({ title, subtitle, children, accent = '#6C5CE7' }) {
    return (
        <div style={{
            background: '#2D1F60', borderRadius: 12, padding: '1.5rem',
            borderTop: `3px solid ${accent}`, marginBottom: '1.5rem'
        }}>
            <h3 style={{ margin: '0 0 0.25rem', color: '#fff', fontSize: '1.1rem' }}>{title}</h3>
            {subtitle && <p style={{ margin: '0 0 1rem', color: '#9988BB', fontSize: 13 }}>{subtitle}</p>}
            {children}
        </div>
    )
}

function ActionBtn({ onClick, disabled, loading, color = '#6C5CE7', children }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            style={{
                padding: '0.6rem 1.2rem', borderRadius: 8, border: 'none',
                background: disabled || loading ? '#3D2A75' : color,
                color: '#fff', fontWeight: 700, fontSize: 14,
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s', opacity: disabled || loading ? 0.6 : 1
            }}
        >
            {loading ? ' Working…' : children}
        </button>
    )
}

function TimingRow({ label, ms, source, rows }) {
    const color = ms === null ? '#9988BB' : ms < 10 ? '#00B894' : ms < 200 ? '#FDCB6E' : '#FF7675'
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '0.75rem', background: '#1A0F3F', borderRadius: 8, marginBottom: 8
        }}>
            <span style={{ flex: 1, color: '#fff', fontWeight: 600, fontSize: 14 }}>{label}</span>
            <span style={{ fontWeight: 800, fontSize: 22, color, minWidth: 80, textAlign: 'right' }}>
                {ms === null ? '—' : `${ms} ms`}
            </span>
            {source && <Badge label={source.includes('cache') ? '⚡ cache' : '🗄 DB'} color={source.includes('cache') ? '#00B894' : '#6C5CE7'} />}
            {rows != null && <span style={{ color: '#9988BB', fontSize: 12 }}>{rows} rows</span>}
        </div>
    )
}

// ── main view ─────────────────────────────────────────────────────────────────

export default function AdminDemoView() {
    const navigate = useNavigate()

    useEffect(() => {
        if (!isAdmin()) navigate('/events')
    }, [])

    // ── seed state ────────────────────────────────────────────────────────────
    const [seedCount, setSeedCount]     = useState(1000)
    const [seedLoading, setSeedLoading] = useState(false)
    const [seedResult, setSeedResult]   = useState(null)
    const [seedError, setSeedError]     = useState(null)

    async function handleSeed() {
        setSeedLoading(true); setSeedResult(null); setSeedError(null)
        try {
            const r = await bulkSeed(seedCount)
            setSeedResult(r)
        } catch (e) { setSeedError(e.message) }
        finally { setSeedLoading(false) }
    }

    // ── stats state ───────────────────────────────────────────────────────────
    const [naiveResult,   setNaiveResult]   = useState(null)
    const [optResult,     setOptResult]     = useState(null)
    const [naiveLoading,  setNaiveLoading]  = useState(false)
    const [optLoading,    setOptLoading]    = useState(false)
    const [statsError,    setStatsError]    = useState(null)
    const [cacheClearing, setCacheClearing] = useState(false)
    const [cacheMsg,      setCacheMsg]      = useState(null)

    async function handleNaive() {
        setNaiveLoading(true); setStatsError(null)
        try   { setNaiveResult(await runNaiveStats()) }
        catch (e) { setStatsError(e.message) }
        finally { setNaiveLoading(false) }
    }

    async function handleOpt() {
        setOptLoading(true); setStatsError(null)
        try   { setOptResult(await runOptimisedStats()) }
        catch (e) { setStatsError(e.message) }
        finally { setOptLoading(false) }
    }

    async function handleClearCache() {
        setCacheClearing(true); setCacheMsg(null)
        try {
            await clearStatsCache()
            setCacheMsg('Cache cleared — next /stats/optimised will re-query the DB.')
            setOptResult(null)
        } catch (e) { setStatsError(e.message) }
        finally { setCacheClearing(false) }
    }

    async function handleBothSequential() {
        setStatsError(null)
        setNaiveLoading(true)
        try { setNaiveResult(await runNaiveStats()) } catch (e) { setStatsError(e.message) }
        setNaiveLoading(false)

        setOptLoading(true)
        try { setOptResult(await runOptimisedStats()) } catch (e) { setStatsError(e.message) }
        setOptLoading(false)
    }

    // ── faker loop ────────────────────────────────────────────────────────────
    const [fakerRunning, setFakerRunning] = useState(false)
    const [fakerMsg,     setFakerMsg]     = useState(null)

    async function handleFaker(action) {
        const fn = action === 'start' ? startFaker : stopFaker
        const result = await fn()
        setFakerMsg(result.message)
        setFakerRunning(action === 'start')
    }

    // ── simulation ────────────────────────────────────────────────────────────
    const [simLoading, setSimLoading] = useState(false)
    const [simResult,  setSimResult]  = useState(null)
    const [simError,   setSimError]   = useState(null)

    async function handleSimulate() {
        setSimLoading(true); setSimResult(null); setSimError(null)
        try   { setSimResult(await runSimulation()) }
        catch (e) { setSimError(e.message) }
        finally { setSimLoading(false) }
    }

    if (!isAdmin()) return null

    // speedup ratio
    const speedup = naiveResult && optResult && optResult.clientMs > 0
        ? (naiveResult.clientMs / optResult.clientMs).toFixed(1)
        : null

    return (
        <div style={{ background: '#1A0F3F', minHeight: '100vh' }}>
            <Header />

            <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem' }}>

                <h2 style={{ color: '#fff', marginBottom: '0.25rem' }}> Admin Demo Panel</h2>
                <p style={{ color: '#9988BB', marginBottom: '2rem', fontSize: 13 }}>
                    Controls for the Gold Challenge presentation — seed data, run stats, demonstrate the cache.
                </p>

                {/* ── SECTION 1: Bulk Seed ─────────────────────────────────── */}
                <Card
                    title="1 · Bulk Seed Database"
                    subtitle="Fills events, event_dates and tickets with faker data. Run this before the JMeter demo."
                    accent="#A29BFE"
                >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <label style={{ color: '#ccc', fontSize: 14 }}>Events to generate:</label>
                        <input
                            type="number"
                            min={100} max={10000} step={100}
                            value={seedCount}
                            onChange={e => setSeedCount(Number(e.target.value))}
                            style={{
                                width: 100, padding: '0.5rem', borderRadius: 6,
                                border: 'none', background: '#1A0F3F', color: '#fff',
                                fontSize: 14, textAlign: 'center'
                            }}
                        />
                        <ActionBtn onClick={handleSeed} loading={seedLoading} color="#A29BFE">
                            🌱 Run Bulk Seed
                        </ActionBtn>
                    </div>

                    {seedError && (
                        <p style={{ color: '#FF7675', marginTop: 10, fontSize: 13 }}>⚠ {seedError}</p>
                    )}

                    {seedResult && (
                        <div style={{
                            marginTop: 12, padding: '0.75rem 1rem', background: '#1A0F3F',
                            borderRadius: 8, display: 'flex', gap: 24, flexWrap: 'wrap'
                        }}>
                            <Stat label="Events"      value={seedResult.events} />
                            <Stat label="Dates"       value={seedResult.eventDates} />
                            <Stat label="Tickets"     value={seedResult.tickets} />
                            <Stat label="Time"        value={`${seedResult.elapsedSec}s`} />
                        </div>
                    )}
                </Card>

                {/* ── SECTION 2: Performance Comparison ───────────────────── */}
                <Card
                    title="2 · Performance Comparison"
                    subtitle="Run both endpoints and see the difference live. Naive re-queries the DB every time. Optimised hits the in-memory cache."
                    accent="#00B894"
                >
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                        <ActionBtn onClick={handleNaive} loading={naiveLoading} color="#FF7675">
                             Run Naive
                        </ActionBtn>
                        <ActionBtn onClick={handleOpt} loading={optLoading} color="#00B894">
                             Run Optimised
                        </ActionBtn>
                        <ActionBtn onClick={handleBothSequential} loading={naiveLoading || optLoading} color="#6C5CE7">
                             Run Both
                        </ActionBtn>
                        <ActionBtn onClick={handleClearCache} loading={cacheClearing} color="#636E72">
                             Clear Cache
                        </ActionBtn>
                    </div>

                    {statsError && (
                        <p style={{ color: '#FF7675', fontSize: 13, marginBottom: 10 }}>⚠ {statsError}</p>
                    )}
                    {cacheMsg && (
                        <p style={{ color: '#FDCB6E', fontSize: 13, marginBottom: 10 }}>ℹ {cacheMsg}</p>
                    )}

                    <TimingRow
                        label="Naive (no cache, no hints)"
                        ms={naiveResult?.clientMs ?? null}
                        source={naiveResult?.source}
                        rows={naiveResult?.count}
                    />
                    <TimingRow
                        label="Optimised (indices + 60s cache)"
                        ms={optResult?.clientMs ?? null}
                        source={optResult?.source}
                        rows={optResult?.count}
                    />

                    {speedup && (
                        <div style={{
                            marginTop: 12, padding: '0.75rem 1.25rem',
                            background: '#00B89422', borderRadius: 8,
                            display: 'flex', alignItems: 'center', gap: 12
                        }}>
                            <span style={{ fontSize: 28 }}></span>
                            <span style={{ color: '#00B894', fontWeight: 800, fontSize: 22 }}>
                                {speedup}×
                            </span>
                            <span style={{ color: '#ccc', fontSize: 14 }}>
                                faster with the optimised endpoint
                            </span>
                        </div>
                    )}

                    {/* DB query time breakdown (from server header) */}
                    {(naiveResult || optResult) && (
                        <div style={{ marginTop: 12 }}>
                            <p style={{ color: '#9988BB', fontSize: 12, marginBottom: 6 }}>
                                Server-side DB query time (X-Query-Ms header):
                            </p>
                            <div style={{ display: 'flex', gap: 16 }}>
                                {naiveResult && (
                                    <span style={{ color: '#FF7675', fontSize: 13 }}>
                                        Naive DB: <strong>{naiveResult.queryMs} ms</strong>
                                    </span>
                                )}
                                {optResult && (
                                    <span style={{ color: '#00B894', fontSize: 13 }}>
                                        Optimised DB: <strong>{optResult.queryMs} ms</strong>
                                        {optResult.source?.includes('cache') && ' (skipped — cache hit)'}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </Card>

                {/* ── SECTION 3: Faker Loop ────────────────────────────────── */}
                <Card
                    title="3 · Real-time Faker Loop"
                    subtitle="Generates a new fake event every 3 seconds and broadcasts it via WebSocket. Shows live feed on the events page."
                    accent="#FDCB6E"
                >
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <ActionBtn
                            onClick={() => handleFaker('start')}
                            disabled={fakerRunning}
                            color="#00B894"
                        >
                            ▶ Start Loop
                        </ActionBtn>
                        <ActionBtn
                            onClick={() => handleFaker('stop')}
                            disabled={!fakerRunning}
                            color="#FF7675"
                        >
                             Stop Loop
                        </ActionBtn>
                        {fakerRunning && <Badge label="● RUNNING" color="#00B894" />}
                        {fakerMsg && (
                            <span style={{ color: '#FDCB6E', fontSize: 13 }}>{fakerMsg}</span>
                        )}
                    </div>
                </Card>

                {/* ── SECTION 5: AI Behaviour Simulation ──────────────────── */}
                <Card
                    title="5 · AI Behaviour Simulation"
                    subtitle="Runs three scenarios as a bot user: rate spike (35 req/10 s), privilege probe (admin routes), and toxic chat detection. Check 👁 Observations after."
                    accent="#E17055"
                >
                    <ActionBtn onClick={handleSimulate} loading={simLoading} color="#E17055">
                         Run All Scenarios
                    </ActionBtn>

                    {simError && (
                        <p style={{ color: '#FF7675', marginTop: 10, fontSize: 13 }}>⚠ {simError}</p>
                    )}

                    {simResult && (
                        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>

                            {/* Rate spike */}
                            <SimRow
                                icon=""
                                label="Rate Spike"
                                status={simResult.rateSpike?.triggered ? 'triggered' : 'not triggered'}
                                detail={simResult.rateSpike?.reason}
                            />

                            {/* Privilege probes */}
                            {simResult.privilegeProbe?.length > 0 ? (
                                simResult.privilegeProbe.map((p, i) => (
                                    <SimRow
                                        key={i}
                                        icon="🔐"
                                        label={`Privilege Probe — ${p.method} ${p.path}`}
                                        status="triggered"
                                        detail={p.reason}
                                    />
                                ))
                            ) : (
                                <SimRow icon="🔐" label="Privilege Probe" status="not triggered" />
                            )}

                            {/* Toxic chat */}
                            {simResult.toxicChat?.map((m, i) => (
                                <SimRow
                                    key={i}
                                    icon=""
                                    label={`"${m.text}"`}
                                    status={m.label === 'unavailable' ? 'HF unavailable' : m.blocked ? 'blocked' : 'allowed'}
                                    detail={m.score !== null ? `${m.label} — ${m.score}% confidence` : null}
                                    blocked={m.blocked}
                                    allowed={!m.blocked && m.label !== 'unavailable'}
                                />
                            ))}

                            <p style={{ color: '#9988BB', fontSize: 12, marginTop: 4 }}>
                                Open Observations and refresh in ~5 s to see AI-generated narratives.
                            </p>
                        </div>
                    )}
                </Card>

                {/* ── SECTION 4: JMeter Cheat Sheet ───────────────────────── */}
                <Card
                    title="4 · JMeter Quick Reference"
                    subtitle="Copy these URLs into your JMeter HTTP samplers."
                    accent="#FD79A8"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                            ['Before (naive)',    'GET', '/stats/naive'],
                            ['After (optimised)', 'GET', '/stats/optimised'],
                            ['Seed data',         'POST', '/faker/bulk-seed'],
                            ['Clear cache',       'POST', '/stats/cache/clear'],
                        ].map(([label, method, path]) => (
                            <div key={path} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '0.6rem 0.75rem', background: '#1A0F3F', borderRadius: 6
                            }}>
                                <Badge
                                    label={method}
                                    color={method === 'GET' ? '#6C5CE7' : '#FDCB6E'}
                                />
                                <span style={{ color: '#ccc', fontSize: 13, flex: 1 }}>{label}</span>
                                <code style={{
                                    color: '#A29BFE', fontSize: 13,
                                    background: '#2D1F60', padding: '2px 8px', borderRadius: 4
                                }}>
                                    http://10.51.0.110:5173{path}
                                </code>
                                <button
                                    onClick={() => navigator.clipboard.writeText(`http://10.51.0.110:5173${path}`)}
                                    style={{
                                        background: 'transparent', border: '1px solid #4d3e96',
                                        color: '#9988BB', borderRadius: 4, padding: '2px 8px',
                                        cursor: 'pointer', fontSize: 12
                                    }}
                                >
                                    Copy
                                </button>
                            </div>
                        ))}
                    </div>
                </Card>

            </div>
        </div>
    )
}

// ── small inline stat display ─────────────────────────────────────────────────
function Stat({ label, value }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#A29BFE', fontWeight: 800, fontSize: 20 }}>{value}</div>
            <div style={{ color: '#9988BB', fontSize: 11, marginTop: 2 }}>{label}</div>
        </div>
    )
}

// ── simulation result row ─────────────────────────────────────────────────────
function SimRow({ icon, label, status, detail, blocked, allowed }) {
    const statusColor =
        blocked  ? '#FF7675' :
        allowed  ? '#00B894' :
        status === 'triggered' ? '#FDCB6E' :
        status === 'HF unavailable' ? '#636E72' : '#9988BB'

    return (
        <div style={{
            padding: '0.6rem 0.75rem', background: '#1A0F3F',
            borderRadius: 8, borderLeft: `3px solid ${statusColor}`
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{icon}</span>
                <span style={{ color: '#ccc', fontSize: 13, flex: 1 }}>{label}</span>
                <span style={{
                    fontSize: 11, fontWeight: 700, color: statusColor,
                    textTransform: 'uppercase', letterSpacing: 1
                }}>
                    {status}
                </span>
            </div>
            {detail && (
                <p style={{ margin: '4px 0 0 24px', color: '#9988BB', fontSize: 11 }}>{detail}</p>
            )}
        </div>
    )
}
