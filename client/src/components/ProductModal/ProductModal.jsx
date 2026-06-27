import { useState } from 'react'
import { useCart } from '../../hooks/useCart'
import { useToast } from '../../hooks/useToast'
import { formatPrice } from '../../utils/formatters'
import styles from './ProductModal.module.css'

export default function ProductModal({ product, onClose }) {
  const { addItem, cart } = useCart()
  const { showToast } = useToast()
  const [imgIndex, setImgIndex] = useState(0)

  if (!product) return null

  const images = product.images?.length
    ? product.images
    : [product.thumbnailUrl || product.image || '/placeholder-logo.svg']

  const status = (product.status || 'available').toLowerCase()
  const isAvailable = status === 'available'
  const isSoldOut = status === 'sold'
  const isReserved = status === 'reserved'
  const productId = product._id || product.id
  const inCart = cart.some(i => i.productId === productId)

  const price = product.salePrice ?? product.price ?? 0
  const original = product.originalPrice ?? null
  const savings = original && original > price ? original - price : 0

  function handleAddToCart() {
    if (inCart) { showToast('Already in cart.', 'info'); return }
    addItem(product)
    showToast('✓ Added to cart!', 'success')
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>

        {/* Image gallery */}
        <div className={styles.imageArea}>
          <img src={images[imgIndex]} alt={product.name} className={styles.mainImage} />
          {images.length > 1 && (
            <div className={styles.thumbs}>
              {images.map((url, i) => (
                <button key={i} className={`${styles.thumb} ${i === imgIndex ? styles.thumbActive : ''}`} onClick={() => setImgIndex(i)}>
                  <img src={url} alt={`View ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className={styles.info}>
          <div className={styles.meta}>
            <span className={styles.category}>{product.category}</span>
            {product.size && <span className={styles.size}>Size {product.size}</span>}
          </div>

          <h2 className={styles.name}>{product.name}</h2>

          <div className={styles.pricing}>
            <span className={styles.salePrice}>{formatPrice(price)}</span>
            {original && original > price && (
              <>
                <span className={styles.originalPrice}>{formatPrice(original)}</span>
                <span className={styles.savings}>Save {formatPrice(savings)}</span>
              </>
            )}
          </div>

          {product.description && (
            <p className={styles.description}>{product.description}</p>
          )}

          {product.tags?.length > 0 && (
            <div className={styles.tags}>
              {product.tags.map(tag => <span key={tag} className={styles.tag}>#{tag}</span>)}
            </div>
          )}

          <button
            className={`btn-primary ${styles.addBtn}`}
            onClick={handleAddToCart}
            disabled={!isAvailable}
          >
            {isSoldOut ? 'Sold Out' : isReserved ? 'Someone is buying this…' : inCart ? 'Already in Cart' : 'Add to Bag'}
          </button>

          {!isAvailable && (
            <p className={styles.unavailableNote}>
              {isReserved ? 'This item is currently being purchased by someone else. Check back soon!' : 'This item has been sold.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
