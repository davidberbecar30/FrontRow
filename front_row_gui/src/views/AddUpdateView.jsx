import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEventById, addEvent, updateEvent } from '../events/evetsList.js'
import Header from '../components/Header.jsx'
import styles from './AddUpdateView.module.css'

function AddUpdateView() {
    const { id } = useParams()
    const navigate = useNavigate()
    const isEditing = Boolean(id)
    const existing = isEditing ? getEventById(Number(id)) : null
    const fileInputRef = useRef(null)

    const [form, setForm] = useState({
        title: existing?.title || '',
        description: existing?.description || '',
        dates: existing?.dates
            ? existing.dates.map(d => `${d.location};${d.venue};${d.date}`).join('\n')
            : '',
        availableTickets: existing?.availableTickets || '',
        price: existing?.price || '',
        image: existing?.image || null,
        imagePreview: existing?.image || null,
        category: existing?.category || '',
    })

    const [errors, setErrors] = useState({})

    function validate() {
        const e = {}
        if (!form.title.trim()) e.title = 'Event name is required'
        if (!form.description.trim()) e.description = 'Description is required'

        if (!form.dates.trim()) {
            e.dates = 'At least one location and date is required'
        } else {
            const lines = form.dates.trim().split('\n')
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/

            const invalidLines = lines.filter(line => {
                const parts = line.split(';')
                if (parts.length !== 3) return true
                const [location, venue, date] = parts.map(p => p.trim())
                if (!location || !venue || !date) return true
                if (!dateRegex.test(date)) return true
                return false
            })

            if (invalidLines.length > 0) {
                e.dates = 'Each line must be: Location;Venue;YYYY-MM-DD'
            }
        }

        if (!form.availableTickets || isNaN(form.availableTickets) || Number(form.availableTickets) <= 0)
            e.availableTickets = 'Enter a valid number of tickets'
        if (!form.price || isNaN(form.price) || Number(form.price) <= 0)
            e.price = 'Enter a valid price'
        return e
    }

    function handleImageChange(e) {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
            setForm(prev => ({
                ...prev,
                image: ev.target.result,
                imagePreview: ev.target.result
            }))
        }
        reader.readAsDataURL(file)
    }

    function parseDates(raw) {
        return raw.trim().split('\n').map(line => {
            const parts = line.split(';')
            return {
                location: parts[0]?.trim() || '',
                venue: parts[1]?.trim() || '',
                date: parts[2]?.trim() || '',
            }
        })
    }

    function handleSubmit() {
        const e = validate()
        if (Object.keys(e).length > 0) {
            setErrors(e)
            return
        }

        const eventData = {
            title: form.title.trim(),
            description: form.description.trim(),
            dates: parseDates(form.dates),
            availableTickets: Number(form.availableTickets),
            price: Number(form.price),
            image: form.image,
            category: form.category.trim(),
        }

        if (isEditing) {
            updateEvent(Number(id), eventData)
        } else {
            addEvent(eventData)
        }

        navigate('/events')
    }

    return (
        <div className={styles.page}>
            <Header />
            <div className={styles.main}>
                <h1 className={styles.pageTitle}>
                    {isEditing ? 'UPDATE EVENT' : 'ADD EVENT'}
                </h1>

                <div className={styles.formCard}>
                    <div className={styles.fieldGroup}>
                        <p className={styles.fieldLabel}>Event Name</p>
                        <input
                            className={styles.fieldInput}
                            placeholder="Enter event's name"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                        />
                        {errors.title && <span style={{ color: '#FF7675', fontSize: '11px' }}>{errors.title}</span>}
                    </div>
                    <div className={styles.fieldGroup}>
                        <p className={styles.fieldLabel}>Event Description</p>
                        <textarea
                            className={styles.fieldTextarea}
                            placeholder="Enter event's description"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                        {errors.description && <span style={{ color: '#FF7675', fontSize: '11px' }}>{errors.description}</span>}
                    </div>

                    <div className={styles.fieldGroup}>
                        <p className={styles.fieldLabel}>Event Locations and Dates</p>
                        <textarea
                            className={styles.fieldLocations}
                            placeholder={'(Location;Venue;Date) one per line\nEg: London;Wembley Stadium;2026-08-08'}
                            value={form.dates}
                            onChange={e => setForm({ ...form, dates: e.target.value })}
                        />
                        {errors.dates && <span style={{ color: '#FF7675', fontSize: '11px' }}>{errors.dates}</span>}
                    </div>

                    <div className={styles.fieldGroup}>
                        <p className={styles.fieldLabel}>Available Tickets</p>
                        <input
                            className={styles.fieldInput}
                            placeholder="Eg: 100"
                            type="number"
                            value={form.availableTickets}
                            onChange={e => setForm({ ...form, availableTickets: e.target.value })}
                        />
                        {errors.availableTickets && <span style={{ color: '#FF7675', fontSize: '11px' }}>{errors.availableTickets}</span>}
                    </div>

                    <div className={styles.fieldGroup}>
                        <p className={styles.fieldLabel}>Base Price</p>
                        <input
                            className={styles.fieldInput}
                            placeholder="Eg: 50"
                            type="number"
                            value={form.price}
                            onChange={e => setForm({ ...form, price: e.target.value })}
                        />
                        {errors.price && <span style={{ color: '#FF7675', fontSize: '11px' }}>{errors.price}</span>}
                    </div>

                    <div className={styles.fieldGroup}>
                        <p className={styles.fieldLabel}>Category</p>
                        <input
                            className={styles.fieldInput}
                            placeholder="Eg: Concert, Sports, Magic"
                            value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value })}
                        />
                    </div>

                    {/* Image Upload */}
                    <div className={styles.fieldGroup}>
                        <p className={styles.fieldLabel}>Event Image</p>
                        <div
                            className={styles.imageUploadArea}
                            onClick={() => fileInputRef.current.click()}
                        >
                            {form.imagePreview
                                ? <img src={form.imagePreview} alt="preview" className={styles.imagePreview} />
                                : <span className={styles.imageUploadPlaceholder}>Click to upload image</span>
                            }
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className={styles.hiddenInput}
                            onChange={handleImageChange}
                        />
                    </div>

                    <div className={styles.btnRow}>
                        <button className={styles.cancelBtn} onClick={() => navigate('/events')}>
                            Cancel
                        </button>
                        <button className={styles.finishBtn} onClick={handleSubmit}>
                            Finish
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default AddUpdateView