import { useNavigate } from 'react-router-dom'
import { formatPrice } from '../../utils/formatters'
import styles from './StepSuccess.module.css'

export default function StepSuccess({ orderDetails, formData, onClose }) {
  const navigate = useNavigate()

  const handleBackHome = () => {
    onClose()
    navigate('/')
  }

  return (
    <div className={styles.container}>
      <div className={styles.successIcon}>✓</div>
      <h3 className={styles.title}>Order Confirmed!</h3>

      <p className={styles.message}>
        Thank you for your purchase, <strong>{formData.name}</strong>!
      </p>

      <div className={styles.confirmationBox}>
        <div className={styles.confirmationRow}>
          <span>Order ID:</span>
          <span className={styles.value}>
            {orderDetails?.orderId || orderDetails?.razorpayOrderId}
          </span>
        </div>
        <div className={styles.confirmationRow}>
          <span>Payment ID:</span>
          <span className={styles.value}>
            {orderDetails?.razorpayPaymentId || '-'}
          </span>
        </div>
        <div className={styles.confirmationRow}>
          <span>Status:</span>
          <span className={`${styles.value} ${styles.success}`}>✓ Completed</span>
        </div>
      </div>

      <div className={styles.emailBox}>
        <p className={styles.emailText}>
          A confirmation email has been sent to <strong>{formData.email}</strong>
        </p>
        <p className={styles.emailSubtext}>
          Check your inbox for tracking information and order details.
        </p>
      </div>

      {orderDetails?.items?.length > 0 && (
        <div className={styles.itemsBox}>
          <h4 className={styles.itemsTitle}>Items</h4>
          <div className={styles.itemsList}>
            {orderDetails.items.map((item) => (
              <div key={item.productId} className={styles.itemRow}>
                <span>{item.name}</span>
                <span>{formatPrice(item.price)}</span>
              </div>
            ))}
          </div>
          <div className={styles.itemsTotal}>
            Total: {formatPrice(orderDetails.totalAmount)}
          </div>
        </div>
      )}

      <div className={styles.shippingBox}>
        <h4 className={styles.shippingTitle}>Shipping To</h4>
        <p className={styles.shippingDetail}>
          {formData.name}
          <br />
          {formData.line1}
          {formData.line2 ? `, ${formData.line2}` : ''}
          <br />
          {formData.city}, {formData.state} {formData.pincode}
          <br />
          {formData.phone}
        </p>
      </div>

      <button onClick={handleBackHome} className={styles.homeBtn}>
        Back to Shop
      </button>

      <p className={styles.footer}>
        Thank you for supporting sustainable fashion! 🌱
      </p>
    </div>
  )
}
