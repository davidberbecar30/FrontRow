import { useState, useRef } from 'react'
import Header from '../components/Header.jsx'
import { apiFetch } from '../api/apiFetch.js'
import styles from './AdminCheckInView.module.css'

async function decodeQRFromFile(file) {
    const jsQR = (await import('jsqr')).default

    return new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)

        img.onload = () => {
            URL.revokeObjectURL(url)

            // Scale down large phone photos — jsQR works best under ~1200px
            const MAX = 1200
            const scale = Math.min(1, MAX / Math.max(img.width, img.height))
            const w = Math.round(img.width  * scale)
            const h = Math.round(img.height * scale)

            const canvas = document.createElement('canvas')
            const ctx    = canvas.getContext('2d')

            // Try all 4 rotations to handle EXIF orientation issues from phone cameras
            const rotations = [0, 90, 180, 270]
            for (const deg of rotations) {
                const rad = (deg * Math.PI) / 180
                const isRotated = deg === 90 || deg === 270

                canvas.width  = isRotated ? h : w
                canvas.height = isRotated ? w : h

                ctx.save()
                ctx.translate(canvas.width / 2, canvas.height / 2)
                ctx.rotate(rad)
                ctx.drawImage(img, -w / 2, -h / 2, w, h)
                ctx.restore()

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const result    = jsQR(imageData.data, imageData.width, imageData.height)
                if (result) {
                    resolve(result.data)
                    return
                }
            }

            reject(new Error('No QR code detected — try better lighting or move closer'))
        }

        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
        img.src = url
    })
}

async function verifyCode(code) {
    const res = await apiFetch('/admin/check-in', {
        method: 'POST',
        body:   JSON.stringify({ code })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Verification failed')
    return data
}

// ── Result card ───────────────────────────────────────────────────────────────
function ResultCard({ result, onReset }) {
    if (!result) return null

    const { valid, alreadyUsed, checkedInAt, purchase } = result
    const buyer = purchase?.buyer
    const event = purchase?.event

    let bgColor = valid ? '#d4edda' : alreadyUsed ? '#fff3cd' : '#f8d7da'
    let textColor = valid ? '#155724' : alreadyUsed ? '#856404' : '#721c24'
    let statusText = valid
        ? 'Valid — Checked in!'
        : alreadyUsed
        ? 'Already used'
        : 'Invalid ticket'

    return (
        <div className={styles.resultCard} style={{ borderColor: valid ? '#28a745' : alreadyUsed ? '#ffc107' : '#dc3545' }}>
            <div className={styles.resultStatus} style={{ background: bgColor, color: textColor }}>
                <span className={styles.resultIcon}>{valid ? '✓' : alreadyUsed ? '⚠' : '✕'}</span>
                {statusText}
            </div>

            {purchase && (
                <div className={styles.resultDetails}>
                    <div className={styles.resultRow}>
                        <span className={styles.resultLabel}>Event</span>
                        <span className={styles.resultValue}>{event?.title || '—'}</span>
                    </div>
                    <div className={styles.resultRow}>
                        <span className={styles.resultLabel}>Category</span>
                        <span className={styles.resultValue}>{event?.category || '—'}</span>
                    </div>
                    <div className={styles.resultRow}>
                        <span className={styles.resultLabel}>Buyer</span>
                        <span className={styles.resultValue}>
                            {buyer ? `${buyer.firstName} ${buyer.lastName}` : '—'}
                        </span>
                    </div>
                    <div className={styles.resultRow}>
                        <span className={styles.resultLabel}>Email</span>
                        <span className={styles.resultValue}>{buyer?.email || '—'}</span>
                    </div>
                    <div className={styles.resultRow}>
                        <span className={styles.resultLabel}>Tickets</span>
                        <span className={styles.resultValue}>{purchase.quantity}</span>
                    </div>
                    <div className={styles.resultRow}>
                        <span className={styles.resultLabel}>Total paid</span>
                        <span className={styles.resultValue}>
                            ${(Number(purchase.unitPrice) * purchase.quantity).toFixed(2)}
                        </span>
                    </div>
                    {checkedInAt && (
                        <div className={styles.resultRow}>
                            <span className={styles.resultLabel}>Checked in</span>
                            <span className={styles.resultValue}>
                                {new Date(checkedInAt).toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>
            )}

            <button className={styles.resetBtn} onClick={onReset}>Scan another</button>
        </div>
    )
}

// ── Main view ─────────────────────────────────────────────────────────────────
function AdminCheckInView() {
    const [manualCode, setManualCode]   = useState('')
    const [loading, setLoading]         = useState(false)
    const [error, setError]             = useState(null)
    const [result, setResult]           = useState(null)
    const [dragOver, setDragOver]       = useState(false)
    const fileInputRef = useRef(null)

    function reset() {
        setResult(null)
        setError(null)
        setManualCode('')
    }

    async function handleCode(code) {
        if (!code?.trim()) return
        setLoading(true)
        setError(null)
        try {
            const data = await verifyCode(code.trim())
            setResult(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleFile(file) {
        if (!file) return
        setLoading(true)
        setError(null)
        try {
            const code = await decodeQRFromFile(file)
            await handleCode(code)
        } catch (err) {
            setError(err.message)
            setLoading(false)
        }
    }

    function onFileChange(e) {
        handleFile(e.target.files?.[0])
        e.target.value = ''
    }

    function onDrop(e) {
        e.preventDefault()
        setDragOver(false)
        handleFile(e.dataTransfer.files?.[0])
    }

    return (
        <div className={styles.page}>
            <Header />
            <div className={styles.content}>
                <h1 className={styles.title}>Check-In Scanner</h1>
                <p className={styles.subtitle}>Upload a ticket QR code image or enter the code manually to verify entry</p>

                {result ? (
                    <ResultCard result={result} onReset={reset} />
                ) : (
                    <div className={styles.panel}>
                        {/* ── Upload / drag & drop ── */}
                        <div
                            className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={onDrop}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={onFileChange}
                            />
                            <div className={styles.dropIcon}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                                    <rect x="14" y="14" width="3" height="3" rx="0.5"/>
                                    <path d="M17 17h4M21 17v4"/>
                                </svg>
                            </div>
                            <p className={styles.dropText}>
                                {loading ? 'Scanning…' : 'Upload or drag & drop a QR code image'}
                            </p>
                            <p className={styles.dropSub}>PNG, JPG, WEBP — screenshot from the buyer's phone works too</p>
                        </div>

                        <div className={styles.divider}><span>or enter code manually</span></div>

                        {/* ── Manual code entry ── */}
                        <div className={styles.manualRow}>
                            <input
                                className={styles.codeInput}
                                type="text"
                                placeholder="Paste check-in code…"
                                value={manualCode}
                                onChange={e => setManualCode(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCode(manualCode)}
                            />
                            <button
                                className={styles.verifyBtn}
                                onClick={() => handleCode(manualCode)}
                                disabled={loading || !manualCode.trim()}
                            >
                                {loading ? '…' : 'Verify'}
                            </button>
                        </div>

                        {error && (
                            <div className={styles.errorBox}>
                                {error}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminCheckInView
