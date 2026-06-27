import { useBanners } from '../../hooks/useBanners'
import { useStoreSettings } from '../../context/StoreSettingsContext'
import styles from './HeroBanner.module.css'

function HeroLeft({ onShopClick }) {
  return (
    <div className={styles.heroLeft}>
      <p className={styles.heroKicker}>Curated Pre-Loved Fashion</p>
      <h1 className={styles.heroTitle}>
        One woman's<br />
        <em className={styles.heroAccent}>wardrobe</em><br />
        is another's<br />
        statement.
      </h1>
      <p className={styles.heroSubtitle}>
        Thoughtfully sourced, beautifully presented — second-hand clothing that feels entirely first-rate.
      </p>
      <div className={styles.heroCtas}>
        <button className={`btn-primary ${styles.heroCta}`} onClick={onShopClick}>
          Explore New Arrivals
        </button>
        <a href="/about" className={`btn-secondary ${styles.heroCtaSecondary}`}>
          Our Story →
        </a>
      </div>
    </div>
  )
}

function GraphicCollage() {
  return (
    <div className={styles.graphicCollage}>
      <div className={styles.graphicBg} />
      <div className={styles.shape1} />
      <div className={styles.shape2} />
      <div className={styles.shape3} />
      <div className={styles.shape4} />
      <div className={styles.shape5} />
      <div className={styles.shape6} />
      <div className={styles.tagCard}>
        <p className={styles.tagCardLabel}>This week</p>
        <p className={styles.tagCardValue}>New pieces</p>
      </div>
    </div>
  )
}

function ImageRight({ banner }) {
  return (
    <div
      className={styles.imageRight}
      style={{ backgroundImage: `url(${banner.imageUrl})` }}
    />
  )
}

export default function HeroBanner({ onShopClick }) {
  const { banners, loading } = useBanners('hero_main')
  const { settings } = useStoreSettings()

  if (loading) {
    return <div className={styles.loadingPlaceholder} />
  }

  const activeBanners = banners.filter(b => b.active)
  const banner = activeBanners[0]

  const handleCtaClick = () => {
    if (banner?.ctaLink?.startsWith('#')) {
      document.getElementById(banner.ctaLink.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else if (banner?.ctaLink) {
      window.location.href = banner.ctaLink
    } else {
      onShopClick?.()
    }
  }

  return (
    <section className={styles.hero}>
      <HeroLeft onShopClick={banner ? handleCtaClick : onShopClick} />
      {banner?.imageUrl ? <ImageRight banner={banner} /> : <GraphicCollage />}
    </section>
  )
}
