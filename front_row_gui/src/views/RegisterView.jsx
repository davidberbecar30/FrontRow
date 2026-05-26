import styles from './RegisterView.module.css'
import logo from '../assets/logo.svg'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { register, verifyRegisterCode } from '../api/authAPI'
import { setSession } from '../auth/currentUser'

function RegisterView() {
    const navigate = useNavigate()
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        dob: '',
    })
    const [errors, setErrors] = useState({})
    const [serverError, setServerError] = useState('')
    const [loading, setLoading] = useState(false)

    // ── Step 2: email verification ───────────────────────────────────
    const [step, setStep] = useState('form') // 'form' | 'code'
    const [registrationToken, setRegistrationToken] = useState('')
    const [code, setCode] = useState('')
    const [codeError, setCodeError] = useState('')
    const [codeLoading, setCodeLoading] = useState(false)

    async function handleSubmit() {
        setServerError('')
        const e = {}
        if (!form.firstName.trim()) e.firstName = 'First name is required'
        if (!form.lastName.trim()) e.lastName = 'Last name is required'
        if (!form.email.trim()) e.email = 'Email is required'
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
        if (!form.password.trim()) e.password = 'Password is required'
        else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
        if (form.dob.trim() === '') e.dob = 'Date of birth is required'
        if (Object.keys(e).length > 0) {
            setErrors(e)
            return
        }
        setErrors({})
        setLoading(true)
        try {
            const result = await register({
                firstName:   form.firstName,
                lastName:    form.lastName,
                email:       form.email,
                password:    form.password,
                dateOfBirth: form.dob
            })
            // Backend now returns { requiresTwoFactor: true, loginToken, email }
            if (result.requiresTwoFactor) {
                setRegistrationToken(result.registrationToken)
                setStep('code')
            } else {
                // Fallback: if somehow a session is returned directly
                setSession({ user: result.user, token: result.token, refreshToken: result.refreshToken })
                navigate('/events')
            }
        } catch (err) {
            setServerError(err.message || 'Registration failed')
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
            const result = await verifyRegisterCode(registrationToken, code)
            setSession({ user: result.user, token: result.token, refreshToken: result.refreshToken })
            navigate('/events')
        } catch (err) {
            setCodeError(err.message || 'Invalid or expired code')
        } finally {
            setCodeLoading(false)
        }
    }

    // ── Code verification step ───────────────────────────────────────
    if (step === 'code') {
        return (
            <div className={styles.page}>
                <div className={styles.card}>

                    <div className={styles.logoWrapper}>
                        <img src={logo} alt="FrontRow logo" className={styles.logo} />
                        <h1 className={styles.brandName}>FrontRow</h1>
                    </div>

                    <h2 className={styles.title}>VERIFY YOUR EMAIL</h2>

                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', maxWidth: 320, marginBottom: 8 }}>
                        A 6-digit verification code has been sent to <strong>{form.email}</strong>.
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
                            onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
                            autoFocus
                        />
                        {codeError && <span className={styles.error}>{codeError}</span>}
                    </div>

                    <button
                        className={styles.registerBtn}
                        onClick={handleVerifyCode}
                        disabled={codeLoading}
                    >
                        {codeLoading ? 'Verifying...' : 'Verify Code'}
                    </button>

                    <p className={styles.loginText}>
                        <span className={styles.loginLink} onClick={() => setStep('form')} style={{ cursor: 'pointer' }}>
                            Back to Register
                        </span>
                    </p>

                </div>
            </div>
        )
    }

    // ── Registration form step ───────────────────────────────────────
    return (
        <div className={styles.page}>
            <div className={styles.card}>

                <div className={styles.logoWrapper}>
                    <img src={logo} alt="FrontRow logo" className={styles.logo} />
                    <h1 className={styles.brandName}>FrontRow</h1>
                </div>

                <h2 className={styles.title}>Register</h2>

                <div className={styles.nameRow}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.labelName}>First Name</label>
                        <input
                            className={styles.inputHalf}
                            type="text"
                            placeholder="John"
                            value={form.firstName}
                            onChange={e => setForm({ ...form, firstName: e.target.value })}
                        />
                        {errors.firstName && <span className={styles.error}>{errors.firstName}</span>}
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.labelName}>Last Name</label>
                        <input
                            className={styles.inputHalf}
                            type="text"
                            placeholder="Doe"
                            value={form.lastName}
                            onChange={e => setForm({ ...form, lastName: e.target.value })}
                        />
                        {errors.lastName && <span className={styles.error}>{errors.lastName}</span>}
                    </div>
                </div>

                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Email</label>
                    <input
                        className={styles.input}
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                    {errors.email && <span className={styles.error}>{errors.email}</span>}
                </div>

                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Password</label>
                    <input
                        className={styles.input}
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                    />
                    {errors.password && <span className={styles.error}>{errors.password}</span>}
                </div>

                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Date of Birth</label>
                    <input
                        className={styles.input}
                        type="date"
                        value={form.dob}
                        onChange={e => setForm({ ...form, dob: e.target.value })}
                    />
                    {errors.dob && <span className={styles.error}>{errors.dob}</span>}
                </div>

                {serverError && (
                    <div className={styles.error} style={{ marginBottom: '1rem' }}>
                        {serverError}
                    </div>
                )}

                <button
                    className={styles.registerBtn}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Registering...' : 'Register'}
                </button>

                <p className={styles.loginText}>
                    Already have an account?{' '}
                    <span className={styles.loginLink} onClick={() => navigate('/login')}>
                        Log In
                    </span>
                </p>

            </div>
        </div>
    )
}

export default RegisterView
