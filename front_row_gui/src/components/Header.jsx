import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import styles from './Header.module.css'
import logo from '../assets/logo.svg'
import favoriteIcon from '../assets/favorite_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import menuIcon from '../assets/menu_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import addIcon from '../assets/add_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import bidIcon from '../assets/bid_landscape_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import chatIcon from '../assets/chat_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import logoutIcon from '../assets/logout_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import OfflineIndicator from './OfflineIndicator.jsx'
import { getCurrentUser, clearCurrentUser, hasPermission, isAdmin } from '../auth/currentUser'

function Header() {

    const navigate = useNavigate()
    const [user, setUser] = useState(getCurrentUser())
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        const handler = () => setUser(getCurrentUser())
        window.addEventListener('authChange', handler)
        return () => window.removeEventListener('authChange', handler)
    }, [])

    function handleLogout() {
        clearCurrentUser()
        setSidebarOpen(false)
        navigate('/login')
    }

    function nav(path) {
        setSidebarOpen(false)
        navigate(path)
    }

    const canCreateEvents = hasPermission('events.create')
    const admin = isAdmin()

    return (
        <>
            <OfflineIndicator/>
            <div className={styles.header}>
                <div className={styles.logoWrapper} onClick={() => navigate('/events')}>
                    <img src={logo} alt="FrontRow" className={styles.logoImg} />
                    <h1 style={{ color: 'white' }}>FrontRow</h1>
                </div>
                <div className={styles.headerIcons}>
                    {user && (
                        <button className={styles.iconBtn} onClick={() => navigate('/favorites')}>
                            <img src={favoriteIcon} alt="Favorites" className={styles.icon} />
                        </button>
                    )}

                    {user ? (
                        <>
                            <span style={{ color: 'white', marginLeft: '0.5rem', fontSize: 14 }}>
                                Hi, {user.firstName}
                            </span>
                            <button className={styles.iconBtn} onClick={handleLogout}>
                                <img src={logoutIcon} alt="Logout" className={styles.icon} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => navigate('/login')} className={styles.textBtn}>Login</button>
                            <button onClick={() => navigate('/register')} className={styles.textBtn}>Register</button>
                        </>
                    )}

                    <button className={styles.iconBtn} onClick={() => setSidebarOpen(true)}>
                        <img src={menuIcon} alt="Menu" className={styles.icon} />
                    </button>
                </div>
            </div>

            {/* ── Sidebar overlay ── */}
            {sidebarOpen && (
                <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── Sidebar panel ── */}
            <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <span className={styles.sidebarTitle}>Menu</span>
                    <button className={styles.closeBtn} onClick={() => setSidebarOpen(false)}>✕</button>
                </div>

                <nav className={styles.sidebarNav}>
                    <button className={styles.sidebarItem} onClick={() => nav('/events')}>
                        Events
                    </button>
                    <button className={styles.sidebarItem} onClick={() => nav('/statistics')}>
                        Statistics
                    </button>
                    {user && (
                        <button className={styles.sidebarItem} onClick={() => nav('/favorites')}>
                            Favorites
                        </button>
                    )}
                    {user && (
                        <button className={styles.sidebarItem} onClick={() => nav('/my-tickets')}>
                            My Tickets
                        </button>
                    )}
                    {user && (
                        <button className={styles.sidebarItem} onClick={() => nav('/chat')}>
                            Chat
                        </button>
                    )}
                    {canCreateEvents && (
                        <button className={styles.sidebarItem} onClick={() => nav('/events/add')}>
                            Add Event
                        </button>
                    )}

                    {admin && (
                        <>
                            <div className={styles.sidebarDivider} />
                            <p className={styles.sidebarSection}>Admin</p>
                            <button className={styles.sidebarItem} onClick={() => nav('/admin/observations')}>
                                Observations
                            </button>
                            <button className={styles.sidebarItem} onClick={() => nav('/admin/demo')}>
                                Demo Panel
                            </button>
                        </>
                    )}

                    <div className={styles.sidebarDivider} />

                    {user ? (
                        <button className={styles.sidebarItem} onClick={handleLogout}>
                            Logout
                        </button>
                    ) : (
                        <>
                            <button className={styles.sidebarItem} onClick={() => nav('/login')}>
                                Login
                            </button>
                            <button className={styles.sidebarItem} onClick={() => nav('/register')}>
                                Register
                            </button>
                        </>
                    )}
                </nav>
            </div>
        </>
    )
}

export default Header
