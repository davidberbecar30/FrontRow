import styles from './LoginView.module.css'
import logo from '../assets/logo.svg'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

function LoginView() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState({})

    function validate() {
        const e = {}
        if (!email.trim()) e.email = 'Email is required'
        else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
        if (!password.trim()) e.password = 'Password is required'
        else if (password.length < 6) e.password = 'Password must be at least 6 characters'
        return e
    }

    function handleLogin() {
        const e = validate()
        if (Object.keys(e).length > 0) {
            setErrors(e)
            return
        }
        navigate('/events')
    }

    return (
        <div className={styles.page}>
            <div className={styles.card}>

                <div className={styles.logoWrapper}>
                    <img src={logo} alt="FrontRow logo" className={styles.logo} />
                    <h1 className={styles.brandName}>FrontRow</h1>
                </div>

                <h2 className={styles.title}>LOG IN</h2>

                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Email</label>
                    <input
                        className={styles.input}
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                    {errors.email && <span className={styles.error}>{errors.email}</span>}
                </div>

                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Password</label>
                    <input
                        className={styles.input}
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                    {errors.password && <span className={styles.error}>{errors.password}</span>}
                </div>

                <button className={styles.loginBtn} onClick={handleLogin}>
                    Log In
                </button>

                <p className={styles.signupText}>
                    Don't have an account?{' '}
                    <span className={styles.signupLink} onClick={() => navigate('/register')}>
                        Sign up
                    </span>
                </p>

            </div>
        </div>
    )
}

export default LoginView