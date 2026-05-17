import styles from './LoginView.module.css'   // reuse the same card style
import logo from '../assets/logo.svg'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { forgotPassword } from '../api/authAPI'

function ForgotPasswordView() {
    const navigate = useNavigate()

    const [email, setEmail]       = useState('')
    const [error, setError]       = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading]   = useState(false)

    async function handleSubmit() {
        setError('')
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
            setError('Enter a valid email address')
            return
        }
        setLoading(true)
        try {
            await forgotPassword(email)
            setSubmitted(true)
        } catch {
            // API always returns 200 — this only fires on a network error
            setError('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.card}>

                <div className={styles.logoWrapper}>
                    <img src={logo} alt="FrontRow logo" className={styles.logo} />
                    <h1 className={styles.brandName}>FrontRow</h1>
                </div>

                <h2 className={styles.title}>RESET PASSWORD</h2>

                {submitted ? (
                    // Success state — same message regardless of whether the email exists
                    <>
                        <p style={{ color: '#fff', textAlign: 'center', lineHeight: 1.6, maxWidth: 300 }}>
                            If that email is registered, a reset link has been sent. Check your inbox (and spam folder).
                        </p>
                        <button className={styles.loginBtn} style={{ marginTop: 8 }} onClick={() => navigate('/login')}>
                            Back to Login
                        </button>
                    </>
                ) : (
                    <>
                        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', maxWidth: 300 }}>
                            Enter your account email and we'll send you a link to reset your password.
                        </p>

                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Email</label>
                            <input
                                className={styles.input}
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                            />
                            {error && <span className={styles.error}>{error}</span>}
                        </div>

                        <button className={styles.loginBtn} onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Sending...' : 'Send Link'}
                        </button>

                        <p className={styles.signupText}>
                            Remember your password?{' '}
                            <span className={styles.signupLink} onClick={() => navigate('/login')}>
                                Log in
                            </span>
                        </p>
                    </>
                )}

            </div>
        </div>
    )
}

export default ForgotPasswordView
