import { useCart } from '../../hooks/useCart'
import { useToast } from '../../hooks/useToast'
import { formatPrice } from '../../utils/formatters'
import styles from './ProductCard.module.css'

export default function ProductCard({ product, onCardClick }) {
  const { addItem, cart } = useCart()
  const { showToast } = useToast()

  const status = (product?.status || 'available').toLowerCase()
  const isAvailable = status === 'available'
  const isSoldOut = status === 'sold'
  const isReserved = status === 'reserved'

  const imageUrl =
    product?.thumbnailUrl ||
    product?.image ||
    product?.images?.[0] ||
    '/placeholder-logo.svg'

  const salePrice = product?.salePrice ?? product?.price ?? product?.originalPrice ?? 0
  const originalPrice = product?.originalPrice ?? null
  const showStrikethrough = originalPrice && originalPrice > salePrice

  const productId = product?._id || product?.id

  const handleAddToCart = (e) => {
    e.stopPropagation()
    if (!isAvailable) return
    if (cart.some((item) => item.productId === productId)) {
      showToast('Already in cart.', 'info')
      return
    }
    addItem(product)
    showToast('Added to bag!', 'success')
  }

  return (
    <div
      className={`${styles.card} ${isSoldOut ? styles.soldCard : ''}`}
      onClick={onCardClick}
      role={onCardClick ? 'button' : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      onKeyDown={onCardClick ? e => e.key === 'Enter' && onCardClick() : undefined}
      style={onCardClick ? { cursor: 'pointer' } : {}}
    >
      <div className={styles.imageWrap}>
        <img
          src={imageUrl}
          alt={product?.name || 'Product'}
          className={styles.image}
          loading="lazy"
        />
        {product?.size && (
          <span className={styles.sizePill}>Size {product.size}</span>
        )}
        {(isSoldOut || isReserved) && (
          <span className={`${styles.statusOverlay} ${isSoldOut ? styles.soldOverlay : styles.reservedOverlay}`}>
            {isSoldOut ? 'Sold' : 'Reserved'}
          </span>
        )}
      </div>

      <div className={styles.content}>
        <p className={styles.name}>{product?.name || 'Untitled'}</p>
        <div className={styles.priceRow}>
          <span className={styles.salePrice}>{formatPrice(salePrice)}</span>
          {showStrikethrough && (
            <span className={styles.originalPrice}>{formatPrice(originalPrice)}</span>
          )}
        </div>
        <button
          onClick={handleAddToCart}
          disabled={!isAvailable}
          className={`${styles.addButton} ${!isAvailable ? styles.disabledButton : ''}`}
        >
          {isSoldOut ? 'Sold Out' : isReserved ? 'Reserved' : 'Add to Bag'}
        </button>
      </div>
    </div>
  )
}
