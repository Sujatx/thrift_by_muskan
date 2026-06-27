import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { loginAdmin, forgotAdminPassword } from '../../services/api'
import styles from './AdminLogin.module.css'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login, isAdmin } = useAuth()
  const { showToast } = useToast()
  const [view, setView] = useState('login') // 'login' | 'forgot' | 'sent'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (isAdmin) {
    navigate('/admin')
    return null
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    try {
      const data = await loginAdmin(email, password)
      const token =
        (typeof data === 'string' && data) ||
        data?.token ||
        data?.accessToken ||
        data?.jwt
      if (!token) throw new Error('Login failed: token missing')
      login(token)
      showToast('Login successful!', 'success')
      navigate('/admin')
    } catch (error) {
      const message = error?.message || 'Login failed'
      setErrorMessage(message)
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    try {
      await forgotAdminPassword(forgotEmail)
      setView('sent')
    } catch (error) {
      setErrorMessage(error?.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (view === 'sent') {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h1 className={styles.title}>Check your email</h1>
              <p className={styles.subtitle}>Reset link sent if that email is registered</p>
            </div>
            <div className={styles.form}>
              <p className={styles.sentText}>
                We sent a password reset link to <strong>{forgotEmail}</strong>. It expires in 1 hour.
              </p>
              <button className={styles.linkBtn} onClick={() => { setView('login'); setErrorMessage('') }}>
                ← Back to login
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (view === 'forgot') {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h1 className={styles.title}>Forgot password</h1>
              <p className={styles.subtitle}>We'll send a reset link to your email</p>
            </div>
            <form onSubmit={handleForgot} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="muskan@thrift.com"
                  required
                  className={styles.input}
                />
              </div>
              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
              {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
              <button type="button" className={styles.linkBtn} onClick={() => { setView('login'); setErrorMessage('') }}>
                ← Back to login
              </button>
            </form>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>Admin Login</h1>
            <p className={styles.subtitle}>Access the Thrift admin dashboard</p>
          </div>
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="muskan@thrift.com"
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className={styles.input}
              />
            </div>
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
            <button type="button" className={styles.linkBtn} onClick={() => { setView('forgot'); setErrorMessage('') }}>
              Forgot password?
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
