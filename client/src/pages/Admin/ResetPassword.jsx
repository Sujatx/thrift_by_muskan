import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { resetAdminPassword } from '../../services/api'
import styles from './AdminLogin.module.css'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h1 className={styles.title}>Invalid link</h1>
              <p className={styles.subtitle}>This reset link is missing or malformed</p>
            </div>
            <div className={styles.form}>
              <button className={styles.linkBtn} onClick={() => navigate('/admin/login')}>
                ← Back to login
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (done) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h1 className={styles.title}>Password updated</h1>
              <p className={styles.subtitle}>You can now log in with your new password</p>
            </div>
            <div className={styles.form}>
              <button className={styles.submitBtn} onClick={() => navigate('/admin/login')}>
                Go to login
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    if (password !== confirm) {
      setErrorMessage('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await resetAdminPassword(token, password)
      setDone(true)
    } catch (error) {
      setErrorMessage(error?.message || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>New password</h1>
            <p className={styles.subtitle}>Choose a strong password</p>
          </div>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                required
                className={styles.input}
              />
            </div>
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
            {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
          </form>
        </div>
      </div>
    </main>
  )
}
