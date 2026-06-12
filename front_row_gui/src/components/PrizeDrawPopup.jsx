import { useState, useEffect, useRef, useCallback } from 'react'
import { enterDraw } from '../api/prizeDrawAPI'
import { getCurrentUser } from '../auth/currentUser'
import styles from './PrizeDrawPopup.module.css'

// ── Wheel colours (app palette) ───────────────────────────────────────────
const SEG_COLORS = [
    '#6C5CE7', '#E84393', '#00B894', '#A29BFE',
    '#fd79a8', '#0984e3', '#e17055', '#00cec9',
    '#fdcb6e', '#b2bec3', '#6c5ce7', '#d63031',
]

// ── Wheel drawing ─────────────────────────────────────────────────────────

function drawWheel(canvas, participants, angleDeg) {
    if (!canvas || participants.length === 0) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    const cx = w / 2, cy = h / 2
    const r  = Math.min(cx, cy) - 16
    const n  = participants.length
    const segDeg = 360 / n

    ctx.clearRect(0, 0, w, h)

    // ── Draw outer ring ───────────────────────────────────────────────────
    ctx.beginPath()
    ctx.arc(cx, cy, r + 10, 0, 2 * Math.PI)
    ctx.fillStyle = '#1A1535'
    ctx.fill()

    // ── Draw segments ─────────────────────────────────────────────────────
    for (let i = 0; i < n; i++) {
        const startRad = ((angleDeg + i * segDeg - 90) * Math.PI) / 180
        const endRad   = ((angleDeg + (i + 1) * segDeg - 90) * Math.PI) / 180

        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, r, startRad, endRad)
        ctx.closePath()
        ctx.fillStyle = SEG_COLORS[i % SEG_COLORS.length]
        ctx.fill()
        ctx.strokeStyle = '#0D0B1E'
        ctx.lineWidth = 2
        ctx.stroke()

        // Label
        const midRad  = (startRad + endRad) / 2
        const textR   = r * 0.65
        const tx      = cx + textR * Math.cos(midRad)
        const ty      = cy + textR * Math.sin(midRad)
        const maxLen  = n > 10 ? 8 : 12
        const label   = participants[i].name.length > maxLen
            ? participants[i].name.substring(0, maxLen - 1) + '…'
            : participants[i].name

        ctx.save()
        ctx.translate(tx, ty)
        ctx.rotate(midRad + Math.PI / 2)
        ctx.textAlign    = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle    = '#FFFFFF'
        ctx.font         = `bold ${Math.max(9, Math.min(12, Math.floor(320 / n)))}px Calibri, Arial`
        ctx.fillText(label, 0, 0)
        ctx.restore()
    }

    // ── Centre hub ────────────────────────────────────────────────────────
    ctx.beginPath()
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI)
    ctx.fillStyle = '#0D0B1E'
    ctx.fill()
    ctx.strokeStyle = '#6C5CE7'
    ctx.lineWidth = 3
    ctx.stroke()
}

function drawPointer(canvas) {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const cx  = canvas.width / 2

    ctx.beginPath()
    ctx.moveTo(cx - 10, 8)
    ctx.lineTo(cx + 10, 8)
    ctx.lineTo(cx, 30)
    ctx.closePath()
    ctx.fillStyle = '#E84393'
    ctx.fill()
    ctx.strokeStyle = '#0D0B1E'
    ctx.lineWidth = 2
    ctx.stroke()
}

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3) }

// ── Countdown helper ──────────────────────────────────────────────────────
function useCountdown(endsAt) {
    const [remaining, setRemaining] = useState('')

    useEffect(() => {
        if (!endsAt) return
        const tick = () => {
            const diff = new Date(endsAt) - Date.now()
            if (diff <= 0) { setRemaining('Ended'); return }
            const h = Math.floor(diff / 3600000)
            const m = Math.floor((diff % 3600000) / 60000)
            const s = Math.floor((diff % 60000) / 1000)
            setRemaining(h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`)
        }
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [endsAt])

    return remaining
}

// ── Main component ────────────────────────────────────────────────────────
export default function PrizeDrawPopup({ mode, draw, winner, participants = [], onClose, onOptIn }) {
    const canvasRef  = useRef(null)
    const rafRef     = useRef(null)
    const [spinning, setSpinning]         = useState(false)
    const [spinDone,  setSpinDone]        = useState(false)
    const [entering,  setEntering]        = useState(false)
    const [optedIn,   setOptedIn]         = useState(draw?.userOptedIn || false)
    const [error,     setError]           = useState(null)
    const countdown = useCountdown(draw?.endsAt)
    const user = getCurrentUser()

    // ── Cap participants to 20 (always include winner) ────────────────────
    const displayParticipants = (() => {
        if (!participants || participants.length === 0) return []
        if (participants.length <= 20) return participants
        const winnerId = winner?.id
        const others   = participants.filter(p => p.id !== winnerId).slice(0, 19)
        const w        = participants.find(p => p.id === winnerId)
        return w ? [...others, w] : others
    })()

    // ── Animate wheel on mount (result mode) ─────────────────────────────
    useEffect(() => {
        if (mode !== 'result' || displayParticipants.length === 0) return

        const canvas  = canvasRef.current
        const n       = displayParticipants.length
        const segDeg  = 360 / n
        const winIdx  = winner
            ? displayParticipants.findIndex(p => p.id === winner.id)
            : 0
        const safeIdx = Math.max(0, winIdx)

        // Target: winner segment centred at pointer (top)
        // targetAngle = spins*360 - (winnerIdx + 0.5) * segDeg
        const spins  = 8
        const target = spins * 360 - (safeIdx + 0.5) * segDeg

        const duration  = 5500   // ms
        let startTime   = null
        setSpinning(true)

        function animate(ts) {
            if (!startTime) startTime = ts
            const elapsed = ts - startTime
            const t       = Math.min(1, elapsed / duration)
            const angle   = target * easeOutCubic(t)

            drawWheel(canvas, displayParticipants, angle)
            drawPointer(canvas)

            if (t < 1) {
                rafRef.current = requestAnimationFrame(animate)
            } else {
                setSpinning(false)
                setSpinDone(true)
            }
        }

        // Draw initial still state, then start after brief pause
        drawWheel(canvas, displayParticipants, 0)
        drawPointer(canvas)
        const delay = setTimeout(() => { rafRef.current = requestAnimationFrame(animate) }, 600)

        return () => {
            clearTimeout(delay)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [mode, displayParticipants.length, winner?.id])

    // Draw still wheel when draw first renders (opt-in already done by user, result mode before spin)
    useEffect(() => {
        if (mode !== 'result' || displayParticipants.length === 0) return
        drawWheel(canvasRef.current, displayParticipants, 0)
        drawPointer(canvasRef.current)
    }, [])  // eslint-disable-line

    async function handleOptIn() {
        if (!user) return
        setEntering(true)
        setError(null)
        try {
            await enterDraw(draw.id)
            setOptedIn(true)
            onOptIn?.()
        } catch (err) {
            setError(err.message)
        } finally {
            setEntering(false)
        }
    }

    const isWinner = winner && user && winner.id === user.id

    // ── Render: opt-in popup ──────────────────────────────────────────────
    if (mode === 'opt-in') {
        return (
            <div className={styles.overlay}>
                <div className={styles.popup}>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>

                    <div className={styles.badge}>🎰 Prize Draw</div>
                    <h2 className={styles.title}>Win a Free Ticket!</h2>

                    {draw?.eventImage && (
                        <img className={styles.eventImg} src={draw.eventImage} alt={draw.eventTitle} />
                    )}

                    <p className={styles.eventTitle}>{draw?.eventTitle}</p>
                    <p className={styles.eventMeta}>
                        {draw?.eventDate && new Date(draw.eventDate).toLocaleDateString('en-US', {
                            weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'
                        })}
                        {draw?.eventVenue ? ` · ${draw.eventVenue}` : ''}
                    </p>
                    <p className={styles.prize}>{draw?.prizeDescription}</p>

                    <div className={styles.countdown}>
                        <span className={styles.countdownLabel}>Time remaining</span>
                        <span className={styles.countdownValue}>{countdown}</span>
                    </div>

                    <p className={styles.note}>
                        Your chances are weighted by how many tickets you've purchased — the more you've bought, the higher your odds!
                    </p>

                    {error && <p className={styles.error}>{error}</p>}

                    {!user ? (
                        <p className={styles.loginNote}>Log in to enter the draw</p>
                    ) : optedIn ? (
                        <div className={styles.enteredBadge}>✓ You're in! Good luck 🍀</div>
                    ) : (
                        <button className={styles.optInBtn} onClick={handleOptIn} disabled={entering}>
                            {entering ? 'Entering…' : 'Opt In — It\'s Free!'}
                        </button>
                    )}
                </div>
            </div>
        )
    }

    // ── Render: result popup ──────────────────────────────────────────────
    return (
        <div className={styles.overlay}>
            <div className={styles.popup}>
                <button className={styles.closeBtn} onClick={onClose}>✕</button>

                <div className={styles.badge}>🎰 Prize Draw Result</div>

                {displayParticipants.length === 0 ? (
                    <>
                        <h2 className={styles.title}>Draw Complete</h2>
                        <p className={styles.note}>No one opted in this time.</p>
                    </>
                ) : (
                    <>
                        <h2 className={styles.title}>
                            {spinDone ? (isWinner ? '🎉 You Won!' : 'Draw Complete') : 'Spinning…'}
                        </h2>

                        <div className={styles.wheelWrap}>
                            <canvas ref={canvasRef} width={320} height={320} className={styles.wheelCanvas} />
                        </div>

                        {spinDone && winner && (
                            <div className={`${styles.winnerBox} ${isWinner ? styles.winnerBoxHighlight : ''}`}>
                                <span className={styles.winnerLabel}>Winner</span>
                                <span className={styles.winnerName}>{winner.name}</span>
                            </div>
                        )}

                        {spinDone && (
                            <>
                                {isWinner ? (
                                    <p className={styles.congratsText}>
                                        Your free ticket for <strong>{draw?.eventTitle}</strong> has been added to My Tickets!
                                    </p>
                                ) : (
                                    <p className={styles.note}>Better luck next time! Check My Tickets for future wins.</p>
                                )}
                            </>
                        )}
                    </>
                )}

                {spinDone && (
                    <button className={styles.optInBtn} onClick={onClose}>Close</button>
                )}
            </div>
        </div>
    )
}
