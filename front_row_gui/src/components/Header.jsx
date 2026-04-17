import { useNavigate } from 'react-router-dom'
import styles from './Header.module.css'
import logo from '../assets/logo.svg'
import favoriteIcon from '../assets/favorite_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import menuIcon from '../assets/menu_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import addIcon from '../assets/add_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import bidIcon from '../assets/bid_landscape_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg'
import OfflineIndicator from "./OfflineIndicator.jsx";

function Header() {
    const navigate = useNavigate()

    async function startFaker() {
        await fetch('http://localhost:3000/faker/start', { method: 'POST' })
    }

    async function stopFaker() {
        await fetch('http://localhost:3000/faker/stop', { method: 'POST' })
    }

    return (
        <>
            <OfflineIndicator/>
        <div className={styles.header}>
            <div className={styles.logoWrapper} onClick={() => navigate('/events')}>
                <img src={logo} alt="FrontRow" className={styles.logoImg} />
                <h1 style={{color:"white"}}>FrontRow</h1>
            </div>
            <div className={styles.headerIcons}>
                <button className={styles.iconBtn} onClick={() => navigate('/favorites')}>
                    <img src={favoriteIcon} alt="Favorites" className={styles.icon} />
                </button>
                <button className={styles.iconBtn}>
                    <img src={bidIcon} alt="Bid" className={styles.icon} onClick={()=> navigate('/statistics')}/>
                </button>
                <button className={styles.iconBtn} onClick={() => navigate('/events/add')}>
                    <img src={addIcon} alt="Add" className={styles.icon} />
                </button>
                <button className={styles.iconBtn}>
                    <img src={menuIcon} alt="Menu" className={styles.icon} />
                </button>
                <button onClick={startFaker}>▶ Start Faker</button>
                <button onClick={stopFaker}>⏹ Stop Faker</button>
            </div>
        </div>

            </>
    )
}

export default Header