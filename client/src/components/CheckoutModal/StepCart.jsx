import { useCart } from '../../hooks/useCart'
import { formatPrice } from '../../utils/formatters'
import styles from './StepCart.module.css'

export default function StepCart({ cartTotal }) {
  const { cart, getTotal } = useCart()
  const total = cartTotal ?? getTotal()

  return (
    <div className={styles.container}>
      <h3 className={styles.stepTitle}>Review Your Order</h3>

      <div className={styles.itemsList}>
        {cart.map((item) => (
          <div key={item.productId} className={styles.item}>
            <img src={item.image} alt={item.name} className={styles.itemImage} />
            <div className={styles.itemInfo}>
              <h4 className={styles.itemName}>{item.name}</h4>
              <p className={styles.itemDetails}>
                {item.quantity} × {formatPrice(item.price)}
              </p>
            </div>
            <div className={styles.itemTotal}>
              {formatPrice(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span>Subtotal:</span>
          <span>{formatPrice(total)}</span>
        </div>
        <div className={styles.divider} />
        <div className={`${styles.summaryRow} ${styles.total}`}>
          <span>Total:</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  )
}
