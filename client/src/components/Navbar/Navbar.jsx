import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useCart } from '../../hooks/useCart'
import { useStoreSettings } from '../../context/StoreSettingsContext'
import styles from './Navbar.module.css'

export default function Navbar({ onCartClick }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { cart } = useCart()
  const { settings } = useStoreSettings()
  const [menuOpen, setMenuOpen] = useState(false)

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  function handleShopClick() {
    setMenuOpen(false)
    if (location.pathname === '/') {
      document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      navigate('/', { state: { scrollTo: 'shop' } })
    }
  }

  const instagramUrl = settings?.instagram || null

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        {/* Logo */}
        <button className={styles.logo} onClick={() => navigate('/')} aria-label="Home">
          <span className={styles.logoText}>{settings?.storeName || 'Thrift by Muskan'}</span>
        </button>

        {/* Desktop nav links */}
        <div className={styles.desktopLinks}>
          <button onClick={handleShopClick} className={styles.navLink}>New In</button>
          <NavLink to="/about" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>
            Our Story
          </NavLink>
          {instagramUrl && (
            <a href={instagramUrl} target="_blank" rel="noreferrer" className={styles.navLink}>
              @thriftbymuskan
            </a>
          )}
        </div>

        {/* Right actions */}
        <div className={styles.actions}>
          <button className={styles.cartBtn} onClick={onCartClick} aria-label={`Cart (${cartCount} items)`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </button>
          <button
            className={styles.menuBtn}
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <button className={styles.mobileLink} onClick={handleShopClick}>New In</button>
          <NavLink to="/about" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Our Story</NavLink>
          {instagramUrl && (
            <a href={instagramUrl} target="_blank" rel="noreferrer" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              @thriftbymuskan
            </a>
          )}
        </div>
      )}
    </nav>
  )
}
