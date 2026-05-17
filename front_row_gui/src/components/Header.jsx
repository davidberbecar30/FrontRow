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

    useEffect(() => {
        const handler = () => setUser(getCurrentUser())
        window.addEventListener('authChange', handler)
        return () => window.removeEventListener('authChange', handler)
    }, [])

    function handleLogout() {
        clearCurrentUser()
        navigate('/login')
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
                    <button className={styles.iconBtn} onClick={() => navigate('/favorites')}>
                        <img src={favoriteIcon} alt="Favorites" className={styles.icon} />
                    </button>
                    <button className={styles.iconBtn}>
                        <img src={bidIcon} alt="Bid" className={styles.icon} onClick={() => navigate('/statistics')}/>
                    </button>

                    {canCreateEvents && (
                        <button className={styles.iconBtn} onClick={() => navigate('/events/add')}>
                            <img src={addIcon} alt="Add" className={styles.icon} />
                        </button>
                    )}

                    <button className={styles.iconBtn}>
                        <img src={menuIcon} alt="Menu" className={styles.icon} />
                    </button>

                    {admin && (
                        <>
                            <button
                                onClick={() => navigate('/admin/demo')}
                                style={{
                                    background: '#6C5CE7', color: '#fff', border: 'none',
                                    borderRadius: 8, padding: '0.4rem 0.9rem',
                                    fontWeight: 700, fontSize: 13, cursor: 'pointer'
                                }}
                            >
                                🎬 Demo Panel
                            </button>
                            <button onClick={() => navigate('/admin/observations')}>👁 Observations</button>
                        </>
                    )}

                    {user ? (
                        <>
                            <button className={styles.iconBtn} onClick={() => navigate('/chat')}>
                                <img src={chatIcon} alt="Chat" className={styles.icon} />
                            </button>
                            <span style={{ color: 'white', marginLeft: '1rem' }}>
                                Hi, {user.firstName} ({user.role?.name})
                            </span>
                            <button className={styles.iconBtn} onClick={handleLogout}>
                                <img src={logoutIcon} alt="Logout" className={styles.icon} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => navigate('/login')}>Login</button>
                            <button onClick={() => navigate('/register')}>Register</button>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}

export default Header
