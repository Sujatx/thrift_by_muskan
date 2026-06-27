import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { useStoreSettings } from '../../context/StoreSettingsContext'
import ProductCard from '../../components/ProductCard/ProductCard'
import FilterBar from '../../components/FilterBar/FilterBar'
import HeroBanner from '../../components/HeroBanner/HeroBanner'
import Ticker from '../../components/Ticker/Ticker'
import ProductModal from '../../components/ProductModal/ProductModal'
import styles from './Home.module.css'

const TESTIMONIALS = [
  {
    text: "I never thought I'd find such beautiful, quality pieces from a thrift shop. Every drop feels like a fashion moment.",
    name: 'Priya M.',
    city: 'Mumbai',
    gradient: 'linear-gradient(135deg, #D4A5A5, #C4714A)',
  },
  {
    text: "The curation is genuinely incredible. Muskan has an eye for pieces that feel timeless. My wardrobe has never looked better.",
    name: 'Aisha K.',
    city: 'Delhi',
    gradient: 'linear-gradient(135deg, #7A8C6E, #3A5C30)',
  },
  {
    text: 'Fast shipping, gorgeous packaging, and the blazer I ordered fits like it was made for me. Will never buy fast fashion again.',
    name: 'Rhea S.',
    city: 'Bangalore',
    gradient: 'linear-gradient(135deg, #C4A96A, #8B5E3C)',
  },
]

export default function Home() {
  const { products, loading, error } = useProducts()
  const { settings } = useStoreSettings()
  const navigate = useNavigate()

  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)

  const categoryFilters = useMemo(() => {
    const cats = settings.categories || ['tops', 'bottoms', 'dresses', 'accessories']
    return [
      { value: 'all', label: 'All' },
      ...cats.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) })),
    ]
  }, [settings.categories])

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return products
      .filter(p => activeFilter === 'all' || p.category === activeFilter)
      .filter(p => !q ||
        p.name?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      )
  }, [products, activeFilter, searchQuery])

  const SkeletonCard = () => (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonImage} />
      <div className={styles.skeletonContent}>
        <div className={styles.skeletonLine} style={{ width: '80%' }} />
        <div className={styles.skeletonLine} style={{ width: '60%' }} />
        <div className={styles.skeletonLine} style={{ width: '40%' }} />
      </div>
    </div>
  )

  const handleShopScroll = () => {
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const whatsappUrl = settings.whatsapp
    ? `https://wa.me/${String(settings.whatsapp).replace(/\D/g, '')}`
    : null

  return (
    <main className={styles.main}>
      <HeroBanner onShopClick={handleShopScroll} />
      <Ticker />

      {/* ── New Arrivals ── */}
      <section className={styles.productsSection} id="shop">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <span className={styles.sectionKicker}>Just dropped</span>
            <h2 className={styles.sectionTitle}>New Arrivals</h2>
          </div>
          <button className={styles.viewAll} onClick={handleShopScroll}>
            View All →
          </button>
        </div>

        <div className={styles.searchRow}>
          <div className={styles.searchInputWrapper}>
            <Search size={15} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search by name or tag…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Search products"
            />
          </div>
        </div>

        <FilterBar
          filters={categoryFilters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {error && <div className={styles.error}>Error loading products: {error}</div>}

        {loading ? (
          <div className={styles.grid}>
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className={styles.empty}>
            <p>{searchQuery ? `No products matching "${searchQuery}"` : 'No products found for this category.'}</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredProducts.map(product => (
              <ProductCard
                key={product._id || product.id}
                product={product}
                onCardClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── About ── */}
      <section className={styles.aboutSection} id="about">
        <div className={styles.aboutGraphic}>
          <div className={styles.aboutGraphicBg} />
          <div className={styles.aboutGraphicBorder} />
          <div className={styles.aboutGraphicCenter}>
            <div className={styles.aboutDressShape} />
            <p className={styles.aboutGraphicQuote}>Every piece is picked with intention</p>
          </div>
          <div className={styles.aboutGraphicDot1} />
          <div className={styles.aboutGraphicDot2} />
        </div>

        <div className={styles.aboutText}>
          <p className={styles.aboutKicker}>Our Story</p>
          <h2 className={styles.aboutTitle}>Fashion that doesn't cost the earth.</h2>
          <p className={styles.aboutBody}>
            Thrift by Muskan started as a weekend wardrobe clear-out and became something much more — a carefully
            curated edit of pre-loved clothing for women who care about how they dress and what their choices mean.
          </p>
          <p className={styles.aboutBody}>
            Every item is hand-selected, inspected, and styled before it reaches you. We believe second-hand should
            never feel second-best.
          </p>
          <div className={styles.aboutStats}>
            <div className={styles.aboutStat}>
              <p className={styles.aboutStatNumber}>500+</p>
              <p className={styles.aboutStatLabel}>Pieces rehomed</p>
            </div>
            <div className={styles.aboutStat}>
              <p className={styles.aboutStatNumber}>3 yrs</p>
              <p className={styles.aboutStatLabel}>Of curating</p>
            </div>
            <div className={styles.aboutStat}>
              <p className={styles.aboutStatNumber}>100%</p>
              <p className={styles.aboutStatLabel}>Hand-picked</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className={styles.testimonialsSection}>
        <div className={styles.testimonialsMeta}>
          <span className={styles.sectionKicker}>What people say</span>
          <h2>Loved by real women</h2>
        </div>
        <div className={styles.testimonialsGrid}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className={styles.testimonialCard}>
              <p className={styles.testimonialQuote}>"</p>
              <p className={styles.testimonialText}>{t.text}</p>
              <div className={styles.testimonialAuthor}>
                <div
                  className={styles.testimonialAvatar}
                  style={{ background: t.gradient }}
                />
                <div>
                  <p className={styles.testimonialName}>{t.name}</p>
                  <p className={styles.testimonialCity}>{t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div>
            <p className={styles.footerBrandName}>{settings.storeName || 'Thrift by Muskan'}</p>
            <p className={styles.footerTagline}>
              {settings.footerTagline || 'Curated pre-loved fashion for women who dress with intention.'}
            </p>
          </div>

          <div>
            <p className={styles.footerColHeading}>Shop</p>
            <div className={styles.footerLinks}>
              <button className={styles.footerLink} onClick={handleShopScroll}>New Arrivals</button>
              {(settings.categories || ['tops', 'bottoms', 'dresses', 'accessories']).slice(0, 4).map(cat => (
                <button
                  key={cat}
                  className={styles.footerLink}
                  onClick={() => {
                    handleShopScroll()
                  }}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className={styles.footerColHeading}>Info</p>
            <div className={styles.footerLinks}>
              <a href="/about" className={styles.footerLink}>Our Story</a>
              {settings.email && (
                <a href={`mailto:${settings.email}`} className={styles.footerLink}>Contact</a>
              )}
              {settings.instagram && (
                <a href={settings.instagram} target="_blank" rel="noreferrer" className={styles.footerLink}>Instagram</a>
              )}
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.footerCopyright}>
            © {new Date().getFullYear()} {settings.storeName || 'Thrift by Muskan'}. All rights reserved.
          </p>
          <div className={styles.footerSocials}>
            {settings.email && (
              <a href={`mailto:${settings.email}`} className={styles.footerSocialBtn} aria-label="Email">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </a>
            )}
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noreferrer" className={styles.footerSocialBtn} aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
                </svg>
              </a>
            )}
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className={styles.footerSocialBtn} aria-label="WhatsApp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.522 5.847L.057 23.5l5.797-1.522A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.693-.5-5.24-1.375l-.374-.222-3.882 1.02 1.04-3.786-.243-.39A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
              </a>
            )}
          </div>
        </div>
      </footer>

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </main>
  )
}
