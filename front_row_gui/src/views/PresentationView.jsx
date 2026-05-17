import styles from './PresentationView.module.css'
import img1 from "../assets/img.png"
import img2 from "../assets/samuel-regan-asante-3BcNKoySAq0-unsplash.jpg"
import logo from "../../public/logo2.svg"
import { useNavigate } from "react-router-dom"

function PresentationView() {
    const navigate = useNavigate()

    return (
        <div className={styles.page}>
            <div className={styles.frame5}>
                <img src={img1} alt="photo1" />
                <img src={img2} alt="photo2" />
            </div>

            <div className={styles.frame6}>

                <div className={styles.logoText}>
                    <img src={logo} alt="FrontRow logo" className={styles.logo} />
                    <h1 className={styles.FR}>FrontRow</h1>
                </div>

                <p className={styles.tagline}>
                    Your front row seats to the best events.
                </p>

                <p className={styles.description}>
                    Discover concerts, festivals, and live events near you. Book tickets instantly and never miss an unforgettable moment.
                </p>
                <p className={styles.getStarted}>Get started now!</p>

                <button className={styles.browseBtn} onClick={() => navigate('/events')}>
                    Browse events
                </button>

                <div className={styles.authRow}>
                    <button
                        className={styles.authBtn}
                        onClick={() => navigate('/login')}
                    >
                        Log In
                    </button>
                    <button
                        className={styles.authBtn}
                        onClick={() => navigate('/register')}
                    >
                        Register
                    </button>
                </div>

            </div>
        </div>
    )
}

export default PresentationView