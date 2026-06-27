import { Trash2 } from 'lucide-react'
import { useCart } from '../../hooks/useCart'
import { formatPrice } from '../../utils/formatters'
import styles from './CartSidebar.module.css'

export default function CartSidebar({ isOpen, onClose, onCheckout }) {
  const { cart, removeItem, updateQuantity, getTotal } = useCart()

  const total = getTotal()

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className={styles.overlay} onClick={onClose} />

      {/* Sidebar */}
      <div className={styles.sidebar}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Your Cart</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Content */}
        {cart.length === 0 ? (
          <div className={styles.empty}>
            <p>Your cart is empty</p>
            <p style={{ fontSize: '0.9rem', marginTop: '12px' }}>
              Start shopping to add items!
            </p>
          </div>
        ) : (
          <>
            {/* Items List */}
            <div className={styles.itemsList}>
              {cart.map((item) => (
                <div key={item.productId} className={styles.cartItem}>
                  <img src={item.image} alt={item.name} className={styles.itemImage} />

                  <div className={styles.itemDetails}>
                    <h4 className={styles.itemName}>{item.name}</h4>
                    <p className={styles.itemPrice}>{formatPrice(item.price)}</p>

                    {/* Quantity Controls */}
                    <div className={styles.quantityControl}>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className={styles.quantityBtn}
                      >
                        −
                      </button>
                      <span className={styles.quantity}>{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className={styles.quantityBtn}
                        disabled={item.quantity >= 1}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.productId)}
                    className={styles.removeBtn}
                    title="Remove from cart"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary */}
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

            {/* Checkout Button */}
            <button
              className={styles.checkoutBtn}
              onClick={onCheckout}
            >
              Proceed to Checkout
            </button>
          </>
        )}
      </div>
    </>
  )
}
