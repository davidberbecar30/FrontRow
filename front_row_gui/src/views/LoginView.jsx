import styles from './LoginView.module.css'
import logo from '../assets/logo.svg'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { login, verifyLoginCode } from '../api/authAPI'
import { setSession } from '../auth/currentUser'

function LoginView() {
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from?.pathname || '/events'

    // Step 1: email + password
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState({})
    const [serverError, setServerError] = useState('')
    const [loading, setLoading] = useState(false)

    // Step 2: 2FA code
    const [step, setStep] = useState('credentials') // 'credentials' | 'code'
    const [loginToken, setLoginToken] = useState('')
    const [code, setCode] = useState('')
    const [codeError, setCodeError] = useState('')
    const [codeLoading, setCodeLoading] = useState(false)

    function validate() {
        const e = {}
        if (!email.trim()) e.email = 'Email is required'
        else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
        if (!password.trim()) e.password = 'Password is required'
        else if (password.length < 6) e.password = 'Password must be at least 6 characters'
        return e
    }

    async function handleLogin() {
        setServerError('')
        const e = validate()
        if (Object.keys(e).length > 0) { setErrors(e); return }
        setErrors({})
        setLoading(true)
        try {
            const result = await login(email, password)
            if (result.requiresTwoFactor) {
                // Move to 2FA code step
                setLoginToken(result.loginToken)
                setStep('code')
                setServerError('')
            } else {
                // OAuth or direct login (shouldn't happen with local strategy anymore)
                setSession(result)
                navigate(from, { replace: true })
            }
        } catch (err) {
            setServerError(err.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    async function handleVerifyCode() {
        setCodeError('')
        if (!code.trim() || code.length !== 6 || !/^\d{6}$/.test(code)) {
            setCodeError('Enter a valid 6-digit code')
            return
        }
        setCodeLoading(true)
        try {
            const result = await verifyLoginCode(loginToken, code)
            setSession(result)
            navigate(from, { replace: true })
        } catch (err) {
            setCodeError(err.message || 'Verification failed')
        } finally {
            setCodeLoading(false)
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') handleLogin()
    }

    function handleCodeKeyDown(e) {
        if (e.key === 'Enter') handleVerifyCode()
    }

    function handleBackToCredentials() {
        setStep('credentials')
        setCode('')
        setCodeError('')
    }

    // ── 2FA Code Step ────────────────────────────────────────────────
    if (step === 'code') {
        return (
            <div className={styles.page}>
                <div className={styles.card}>

                    <div className={styles.logoWrapper}>
                        <img src={logo} alt="FrontRow logo" className={styles.logo} />
                        <h1 className={styles.brandName}>FrontRow</h1>
                    </div>

                    <h2 className={styles.title}>VERIFY YOUR LOGIN</h2>

                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', maxWidth: 320, marginBottom: 8 }}>
                        A 6-digit verification code has been sent to <strong>{email}</strong>.
                        Check your inbox (and spam folder).
                    </p>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Verification Code</label>
                        <input
                            className={styles.input}
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="000000"
                            value={code}
                            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            onKeyDown={handleCodeKeyDown}
                            autoFocus
                        />
                        {codeError && <span className={styles.error}>{codeError}</span>}
                    </div>

                    <button className={styles.loginBtn} onClick={handleVerifyCode} disabled={codeLoading}>
                        {codeLoading ? 'Verifying...' : 'Verify Code'}
                    </button>

                    <p className={styles.signupText}>
                        <span className={styles.signupLink} onClick={handleBackToCredentials} style={{ cursor: 'pointer' }}>
                            Back to Login
                        </span>
                    </p>

                </div>
            </div>
        )
    }

    // ── Credentials Step ─────────────────────────────────────────────
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
                        onKeyDown={handleKeyDown}
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
                        onKeyDown={handleKeyDown}
                    />
                    {errors.password && <span className={styles.error}>{errors.password}</span>}
                </div>

                <p className={styles.forgotLink} onClick={() => navigate('/forgot-password')}>
                    Forgot your password?
                </p>

                {serverError && (
                    <div className={styles.error} style={{ marginBottom: '1rem' }}>
                        {serverError}
                    </div>
                )}

                <button className={styles.loginBtn} onClick={handleLogin} disabled={loading}>
                    {loading ? 'Logging in...' : 'Log In'}
                </button>

                <div className={styles.divider}>
                    <span>or</span>
                </div>

                <button
                    className={styles.googleBtn}
                    onClick={() => { window.location.href = `${import.meta.env.VITE_API_URL || ''}/auth/google` }}
                >
                    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                        <path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.175 0 7.55 0 9s.348 2.826.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 6.294C4.672 4.169 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
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
