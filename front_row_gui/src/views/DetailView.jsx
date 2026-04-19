import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    getEventById,
    deleteEvent,
    toggleFavorite,
    getTicketsByEventId,
    getTicketStatsByEventId,
    addTicket,
    updateTicket,
    deleteTicket
} from '../api/eventsAPI.js'
import Header from '../components/Header.jsx'
import styles from './DetailView.module.css'

function DetailView() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [event, setEvent] = useState(null)
    const [quantities, setQuantities] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // ─── Ticket state ──────────────────────────────────────
    const [tickets, setTickets] = useState([])
    const [ticketStats, setTicketStats] = useState(null)
    const [showAddTicket, setShowAddTicket] = useState(false)
    const [editingTicket, setEditingTicket] = useState(null)
    const [ticketForm, setTicketForm] = useState({
        seat: '',
        section: '',
        status: 'available',
        price: ''
    })

    useEffect(() => {
        async function loadEvent() {
            try {
                setLoading(true)
                const data = await getEventById(id)
                setEvent(data)
                setQuantities(data.dates.map(() => 1))
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        loadEvent()
        loadTickets()
    }, [id])

    async function loadTickets() {
        try {
            const [ticketsData, statsData] = await Promise.all([
                getTicketsByEventId(id),
                getTicketStatsByEventId(id)
            ])
            setTickets(ticketsData)
            setTicketStats(statsData)
        } catch (err) {
            console.error('Failed to load tickets:', err)
        }
    }

    async function handleDelete() {
        try {
            await deleteEvent(id)
            navigate('/events')
        } catch (err) {
            setError(err.message)
        }
    }

    async function handleFavorite() {
        try {
            const updated = await toggleFavorite(id)
            setEvent(updated)
        } catch (err) {
            setError(err.message)
        }
    }

    function incrementQty(index) {
        setQuantities(prev => prev.map((q, i) => i === index ? q + 1 : q))
    }

    function decrementQty(index) {
        setQuantities(prev => prev.map((q, i) => i === index ? Math.max(1, q - 1) : q))
    }

    // ─── Ticket handlers ───────────────────────────────────
    async function handleAddTicket() {
        if (!ticketForm.seat || !ticketForm.section) return
        try {
            await addTicket(id, {
                ...ticketForm,
                price: Number(ticketForm.price)
            })
            setTicketForm({ seat: '', section: '', status: 'available', price: '' })
            setShowAddTicket(false)
            loadTickets()
        } catch (err) {
            setError(err.message)
        }
    }

    async function handleUpdateTicket() {
        if (!editingTicket) return
        try {
            await updateTicket(editingTicket.id, {
                ...ticketForm,
                price: Number(ticketForm.price)
            })
            setEditingTicket(null)
            setTicketForm({ seat: '', section: '', status: 'available', price: '' })
            loadTickets()
        } catch (err) {
            setError(err.message)
        }
    }

    async function handleDeleteTicket(ticketId) {
        try {
            await deleteTicket(ticketId)
            loadTickets()
        } catch (err) {
            setError(err.message)
        }
    }

    function startEdit(ticket) {
        setEditingTicket(ticket)
        setTicketForm({
            seat: ticket.seat,
            section: ticket.section,
            status: ticket.status,
            price: ticket.price || ''
        })
        setShowAddTicket(false)
    }

    if (loading) return <p style={{ padding: '40px', color: '#6C5CE7' }}>Loading...</p>
    if (error) return <p style={{ padding: '40px', color: '#FF7675' }}>{error}</p>
    if (!event) return null

    return (
        <div className={styles.page}>
            <Header />
            <div className={styles.content}>
                <div className={styles.gallery}>
                    <img className={styles.galleryImg} src={event.image} alt={event.title} />
                </div>
                <div className={styles.details}>
                    <div className={styles.titleRow}>
                        <h1 className={styles.title}>{event.title}</h1>
                        <button className={styles.favoriteBtn} onClick={handleFavorite}>
                            {event.favorited ? '❤️' : '🤍'}
                        </button>
                    </div>
                    <p className={styles.description}>{event.description}</p>
                    <div className={styles.adminActions}>
                        <button className={styles.deleteBtn} onClick={handleDelete}>
                            [Delete]
                        </button>
                        <button
                            className={styles.updateBtn}
                            onClick={() => navigate(`/events/${event.id}/edit`)}
                        >
                            [Update]
                        </button>
                    </div>
                    <div className={styles.datesFrame}>
                        {event.dates.map((dateObj, index) => (
                            <div key={index} className={styles.eventDetailRow}>
                                <div className={styles.detailCell}>
                                    <p className={styles.detailText}>
                                        {dateObj.date}{'\n'}{dateObj.venue},{'\n'}{dateObj.location}
                                    </p>
                                </div>
                                <div className={styles.detailCell}>
                                    <p className={styles.detailText}>
                                        Available Tickets:{'\n'}{event.availableTickets}
                                    </p>
                                </div>
                                <div className={styles.detailCell}>
                                    <p className={styles.detailText}>
                                        Section{'\n'}Choose Section
                                    </p>
                                </div>
                                <div className={styles.quantityCell}>
                                    <button className={styles.quantityBtn} onClick={() => decrementQty(index)}>−</button>
                                    <span className={styles.quantityNum}>{quantities[index]}</span>
                                    <button className={styles.quantityBtn} onClick={() => incrementQty(index)}>+</button>
                                </div>
                                <div className={styles.totalCell}>
                                    <p className={styles.totalText}>
                                        Total{'\n'}${event.price * quantities[index]}
                                    </p>
                                </div>
                                <button className={styles.buyBtn}>BUY NOW!</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Tickets Section ─── */}
            <div className={styles.ticketsSection}>
                <div className={styles.ticketsHeader}>
                    <h2 className={styles.ticketsTitle}>Tickets</h2>
                    <button
                        className={styles.addTicketBtn}
                        onClick={() => { setShowAddTicket(true); setEditingTicket(null) }}
                    >
                        + Add Ticket
                    </button>
                </div>

                {/* ─── Ticket Stats ─── */}
                {ticketStats && (
                    <div className={styles.ticketStats}>
                        <div className={styles.statBox}>
                            <p className={styles.statNumber}>{ticketStats.total}</p>
                            <p className={styles.statLabel}>Total</p>
                        </div>
                        <div className={styles.statBox}>
                            <p className={styles.statNumber}>{ticketStats.available}</p>
                            <p className={styles.statLabel}>Available</p>
                        </div>
                        <div className={styles.statBox}>
                            <p className={styles.statNumber}>{ticketStats.sold}</p>
                            <p className={styles.statLabel}>Sold</p>
                        </div>
                        <div className={styles.statBox}>
                            <p className={styles.statNumber}>{ticketStats.reserved}</p>
                            <p className={styles.statLabel}>Reserved</p>
                        </div>
                        <div className={styles.statBox}>
                            <p className={styles.statNumber}>${ticketStats.revenue}</p>
                            <p className={styles.statLabel}>Revenue</p>
                        </div>
                    </div>
                )}

                {/* ─── Add/Edit Ticket Form ─── */}
                {(showAddTicket || editingTicket) && (
                    <div className={styles.ticketForm}>
                        <h3>{editingTicket ? 'Edit Ticket' : 'Add Ticket'}</h3>
                        <input
                            className={styles.ticketInput}
                            placeholder="Seat (e.g. A1)"
                            value={ticketForm.seat}
                            onChange={e => setTicketForm({ ...ticketForm, seat: e.target.value })}
                        />
                        <input
                            className={styles.ticketInput}
                            placeholder="Section (e.g. VIP)"
                            value={ticketForm.section}
                            onChange={e => setTicketForm({ ...ticketForm, section: e.target.value })}
                        />
                        <select
                            className={styles.ticketInput}
                            value={ticketForm.status}
                            onChange={e => setTicketForm({ ...ticketForm, status: e.target.value })}
                        >
                            <option value="available">Available</option>
                            <option value="sold">Sold</option>
                            <option value="reserved">Reserved</option>
                        </select>
                        <input
                            className={styles.ticketInput}
                            placeholder="Price"
                            type="number"
                            value={ticketForm.price}
                            onChange={e => setTicketForm({ ...ticketForm, price: e.target.value })}
                        />
                        <div className={styles.ticketFormBtns}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => { setShowAddTicket(false); setEditingTicket(null) }}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.finishBtn}
                                onClick={editingTicket ? handleUpdateTicket : handleAddTicket}
                            >
                                {editingTicket ? 'Update' : 'Add'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Tickets List ─── */}
                <div className={styles.ticketsList}>
                    {tickets.length === 0 ? (
                        <p style={{ color: '#9988BB' }}>No tickets yet for this event.</p>
                    ) : (
                        tickets.map(ticket => (
                            <div key={ticket.id} className={styles.ticketRow}>
                                <span className={styles.ticketSeat}>Seat {ticket.seat}</span>
                                <span className={styles.ticketSection}>{ticket.section}</span>
                                <span className={styles.ticketStatus}
                                      style={{
                                          color: ticket.status === 'available' ? '#1D9E75' :
                                              ticket.status === 'sold' ? '#FF7675' : '#EF9F27'
                                      }}>
                                    {ticket.status}
                                </span>
                                <span className={styles.ticketPrice}>${ticket.price}</span>
                                <button
                                    className={styles.ticketEditBtn}
                                    onClick={() => startEdit(ticket)}
                                >
                                    Edit
                                </button>
                                <button
                                    className={styles.ticketDeleteBtn}
                                    onClick={() => handleDeleteTicket(ticket.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default DetailView