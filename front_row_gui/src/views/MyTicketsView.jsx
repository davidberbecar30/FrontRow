import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { getMyTickets, getOutfitSuggestion, saveOutfitSuggestion } from '../api/eventsAPI.js'
import styles from './MyTicketsView.module.css'
import QRCode from 'qrcode'

// ── QR Ticket Modal ───────────────────────────────────────────────────────────
function QRModal({ purchase, onClose }) {
    const canvasRef = useRef(null)

    useEffect(() => {
        if (!purchase?.checkInCode || !canvasRef.current) return
        QRCode.toCanvas(canvasRef.current, purchase.checkInCode, {
            width: 220,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' }
        })
    }, [purchase])

    if (!purchase) return null
    const ev = purchase.event

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Your Ticket QR</h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>
                <p className={styles.modalSub}>
                    Show this at the door for <strong>{ev?.title}</strong>
                </p>
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    {purchase.checkInCode
                        ? <canvas ref={canvasRef} style={{ borderRadius: 8 }} />
                        : <p style={{ color: '#888' }}>QR code not available for this ticket.</p>
                    }
                    {purchase.checkedIn && (
                        <div style={{
                            marginTop: 12,
                            padding: '8px 16px',
                            background: '#d4edda',
                            borderRadius: 6,
                            color: '#155724',
                            fontWeight: 600,
                            fontSize: 14
                        }}>
                            Already checked in
                        </div>
                    )}
                    {purchase.checkInCode && (
                        <p style={{ color: '#aaa', fontSize: 11, marginTop: 8, wordBreak: 'break-all' }}>
                            {purchase.checkInCode}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Outfit Modal ──────────────────────────────────────────────────────────────
function OutfitModal({ purchase, onClose, onSave }) {
    const [gender, setGender]   = useState('male')
    const [outfit, setOutfit]   = useState(purchase.outfitSuggestion || null)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving]   = useState(false)
    const [saved, setSaved]     = useState(!!purchase.outfitSuggestion)
    const [error, setError]     = useState(null)

    async function handleGenerate() {
        setLoading(true)
        setError(null)
        setSaved(false)
        try {
            const result = await getOutfitSuggestion(purchase.eventId, gender)
            setOutfit(result.outfit)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        if (!outfit) return
        setSaving(true)
        try {
            await saveOutfitSuggestion(purchase.id, outfit)
            setSaved(true)
            onSave(outfit)
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>What to Wear</h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>
                <p className={styles.modalSub}>
                    Outfit ideas for <strong>{purchase.event?.title}</strong>
                </p>

                {!outfit && (
                    <div className={styles.genderRow}>
                        <button
                            className={`${styles.genderBtn} ${gender === 'male' ? styles.genderActive : ''}`}
                            onClick={() => setGender('male')}
                        >
                            Male
                        </button>
                        <button
                            className={`${styles.genderBtn} ${gender === 'female' ? styles.genderActive : ''}`}
                            onClick={() => setGender('female')}
                        >
                            Female
                        </button>
                    </div>
                )}

                {error && <p className={styles.outfitError}>{error}</p>}

                {outfit ? (
                    <>
                        <div className={styles.outfitGrid}>
                            {[
                                { label: 'Top',    item: outfit.top    },
                                { label: 'Bottom', item: outfit.bottom }
                            ].map(({ label, item }) => (
                                <div key={label} className={styles.outfitCard}>
                                    <div className={styles.outfitImgWrap}>
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className={styles.outfitImg}
                                            onError={e => { e.target.style.background = '#EDE8FF'; e.target.style.display = 'none' }}
                                        />
                                    </div>
                                    <div className={styles.outfitInfo}>
                                        <span className={styles.outfitLabel}>{label}</span>
                                        <h3 className={styles.outfitName}>{item.name}</h3>
                                        <p className={styles.outfitDesc}>{item.description}</p>
                                        <div className={styles.storeLinks}>
                                            {item.stores.map(s => (
                                                <a
                                                    key={s.name}
                                                    href={s.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.storeBtn}
                                                >
                                                    {s.name} →
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.outfitActions}>
                            <button
                                className={styles.regenerateBtn}
                                onClick={() => { setOutfit(null); setSaved(false) }}
                            >
                                Try different look
                            </button>
                            <button
                                className={`${styles.saveBtn} ${saved ? styles.saveBtnSaved : ''}`}
                                onClick={handleSave}
                                disabled={saving || saved}
                            >
                                {saved ? 'Saved' : saving ? 'Saving…' : 'Save this look'}
                            </button>
                        </div>
                    </>
                ) : (
                    <button
                        className={styles.generateBtn}
                        onClick={handleGenerate}
                        disabled={loading}
                    >
                        {loading ? 'Finding your look…' : 'Get Outfit Suggestion'}
                    </button>
                )}
            </div>
        </div>
    )
}

// ── Main view ─────────────────────────────────────────────────────────────────
function MyTicketsView() {
    const navigate = useNavigate()
    const [purchases, setPurchases]       = useState([])
    const [loading, setLoading]           = useState(true)
    const [error, setError]               = useState(null)
    const [activeOutfit, setActiveOutfit] = useState(null)
    const [activeQR, setActiveQR]         = useState(null)

    useEffect(() => {
        getMyTickets()
            .then(data => setPurchases(data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    function handleSavedOutfit(purchaseId, outfit) {
        setPurchases(prev => prev.map(p =>
            p.id === purchaseId ? { ...p, outfitSuggestion: outfit } : p
        ))
    }

    return (
        <div className={styles.page}>
            <Header />
            <div className={styles.content}>
                <h1 className={styles.title}>My Tickets</h1>
                <p className={styles.subtitle}>All tickets purchased on your account</p>

                {loading && <p className={styles.state}>Loading...</p>}
                {error   && <p className={styles.stateError}>{error}</p>}

                {!loading && !error && purchases.length === 0 && (
                    <div className={styles.empty}>
                        <p>You have no tickets yet.</p>
                        <button className={styles.browseBtn} onClick={() => navigate('/events')}>
                            Browse Events
                        </button>
                    </div>
                )}

                <div className={styles.list}>
                    {purchases.map(p => {
                        const ev     = p.event
                        const date   = ev?.dates?.[0]
                        const total  = (Number(p.unitPrice) * p.quantity).toFixed(2)
                        const bought = new Date(p.createdAt).toLocaleDateString()

                        return (
                            <div key={p.id} className={styles.cardWrapper}>
                                <div className={styles.card} onClick={() => navigate(`/events/${ev.id}`)}>
                                    {ev.image && (
                                        <img src={ev.image} alt={ev.title} className={styles.image} />
                                    )}
                                    <div className={styles.info}>
                                        <h2 className={styles.eventTitle}>{ev.title}</h2>
                                        {date && (
                                            <p className={styles.meta}>{date.venue} &middot; {date.location} &middot; {date.date}</p>
                                        )}
                                        <div className={styles.tags}>
                                            <span className={styles.tag}>{p.quantity} ticket{p.quantity > 1 ? 's' : ''}</span>
                                            <span className={styles.tag}>${total} total</span>
                                            <span className={styles.tagGray}>Purchased {bought}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.outfitRow}>
                                    {p.outfitSuggestion && (
                                        <span className={styles.savedBadge}>Look saved</span>
                                    )}
                                    {p.checkedIn && (
                                        <span className={styles.savedBadge} style={{ background: '#d4edda', color: '#155724' }}>Checked in</span>
                                    )}
                                    <button
                                        className={styles.wearBtn}
                                        style={{ background: '#2d3436' }}
                                        onClick={() => setActiveQR(p)}
                                    >
                                        Show QR
                                    </button>
                                    <button
                                        className={styles.wearBtn}
                                        onClick={() => setActiveOutfit(p)}
                                    >
                                        What to Wear
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {activeQR && (
                <QRModal
                    purchase={activeQR}
                    onClose={() => setActiveQR(null)}
                />
            )}

            {activeOutfit && (
                <OutfitModal
                    purchase={activeOutfit}
                    onClose={() => setActiveOutfit(null)}
                    onSave={(outfit) => {
                        handleSavedOutfit(activeOutfit.id, outfit)
                    }}
                />
            )}
        </div>
    )
}

export default MyTicketsView
