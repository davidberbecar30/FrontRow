import styles from './LoginView.module.css'   // reuse card style
import logo from '../assets/logo.svg'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { resetPassword } from '../api/authAPI'

function ResetPasswordView() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token') || ''

    const [newPassword, setNewPassword]     = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [errors, setErrors]               = useState({})
    const [serverError, setServerError]     = useState('')
    const [success, setSuccess]             = useState(false)
    const [loading, setLoading]             = useState(false)

    function validate() {
        const e = {}
        if (!newPassword) e.newPassword = 'Password is required'
        else if (newPassword.length < 6) e.newPassword = 'Password must be at least 6 characters'
        if (newPassword !== confirmPassword) e.confirmPassword = 'Passwords do not match'
        return e
    }

    async function handleReset() {
        setServerError('')
        const e = validate()
        if (Object.keys(e).length > 0) { setErrors(e); return }
        setErrors({})

        if (!token) {
            setServerError('Reset token is missing. Please use the link from your email.')
            return
        }

        setLoading(true)
        try {
            await resetPassword(token, newPassword)
            setSuccess(true)
        } catch (err) {
            setServerError(err.message || 'Reset failed. The link may have expired.')
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return (
            <div className={styles.page}>
                <div className={styles.card}>
                    <div className={styles.logoWrapper}>
                        <img src={logo} alt="FrontRow logo" className={styles.logo} />
                        <h1 className={styles.brandName}>FrontRow</h1>
                    </div>
                    <h2 className={styles.title}>RESET PASSWORD</h2>
                    <p style={{ color: '#FF7675', textAlign: 'center' }}>
                        Invalid reset link. Please request a new one.
                    </p>
                    <button className={styles.loginBtn} onClick={() => navigate('/forgot-password')}>
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.card}>

                <div className={styles.logoWrapper}>
                    <img src={logo} alt="FrontRow logo" className={styles.logo} />
                    <h1 className={styles.brandName}>FrontRow</h1>
                </div>

                <h2 className={styles.title}>NEW PASSWORD</h2>

                {success ? (
                    <>
                        <p style={{ color: '#fff', textAlign: 'center', lineHeight: 1.6, maxWidth: 300 }}>
                            Your password has been reset. You can now log in with your new password.
                        </p>
                        <button className={styles.loginBtn} onClick={() => navigate('/login')}>
                            Log In
                        </button>
                    </>
                ) : (
                    <>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>New Password</label>
                            <input
                                className={styles.input}
                                type="password"
                                placeholder="At least 6 characters"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleReset()}
                            />
                            {errors.newPassword && <span className={styles.error}>{errors.newPassword}</span>}
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Confirm Password</label>
                            <input
                                className={styles.input}
                                type="password"
                                placeholder="Repeat your new password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleReset()}
                            />
                            {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
                        </div>

                        {serverError && (
                            <p className={styles.error} style={{ textAlign: 'center' }}>
                                {serverError}
                            </p>
                        )}

                        <button className={styles.loginBtn} onClick={handleReset} disabled={loading}>
                            {loading ? 'Saving...' : 'Set Password'}
                        </button>

                        <p className={styles.signupText}>
                            <span className={styles.signupLink} onClick={() => navigate('/login')}>
                                Back to Login
                            </span>
                        </p>
                    </>
                )}

            </div>
        </div>
    )
}

export default ResetPasswordView
