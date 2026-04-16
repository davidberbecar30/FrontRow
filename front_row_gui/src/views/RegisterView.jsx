import styles from './RegisterView.module.css'
import logo from '../assets/logo.svg'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

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

    function handleSubmit() {
        const e={}
        if(!form.firstName.trim()) e.firstName = 'First name is required'
        if(!form.lastName.trim()) e.lastName = 'Last name is required'
        if (!form.email.trim()) e.email = 'Email is required'
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
        if (!form.password.trim()) e.password = 'Password is required'
        else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
        if(form.dob.trim() === '') e.dob = 'Date of birth is required'
        if(Object.keys(e).length>0){
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

                <button className={styles.registerBtn} onClick={handleSubmit}>
                    Register
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