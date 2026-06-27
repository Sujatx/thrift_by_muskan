import { useToast } from '../../hooks/useToast'
import styles from './Toast.module.css'

export default function Toast() {
  const { toasts, removeToast } = useToast()

  return (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
          <div className={styles.content}>{toast.message}</div>
          <button
            className={styles.closeButton}
            onClick={() => removeToast(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
