import styles from './About.module.css'

export default function About() {
  return (
    <main className={styles.main}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>About Thrift</h1>
        <p className={styles.heroSubtitle}>
          Sustainable fashion, one piece at a time
        </p>
      </section>

      {/* Story Section */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Our Story</h2>
          <p className={styles.text}>
            Thrift by Muskan was founded with a simple vision: to make sustainable
            fashion accessible to everyone. We believe that beautiful, high-quality
            clothing doesn't need to be new—it can be pre-loved.
          </p>
          <p className={styles.text}>
            Every piece in our collection is carefully curated and thoughtfully
            sourced. We're passionate about reducing waste, extending the lifecycle
            of clothing, and building a community around conscious consumption.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className={styles.sectionAlt}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Our Mission</h2>
          <p className={styles.text}>
            We aim to make sustainable fashion the norm, not the exception. By
            offering a curated selection of pre-owned clothing at affordable prices,
            we're making it easier for people to shop consciously.
          </p>

          <div className={styles.values}>
            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>♻️</div>
              <h3 className={styles.valueTitle}>Sustainability</h3>
              <p className={styles.valueText}>
                Reducing waste and giving clothing a second life
              </p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>💚</div>
              <h3 className={styles.valueTitle}>Quality</h3>
              <p className={styles.valueText}>
                Every piece is carefully inspected and loved
              </p>
            </div>

            <div className={styles.valueCard}>
              <div className={styles.valueIcon}>✨</div>
              <h3 className={styles.valueTitle}>Community</h3>
              <p className={styles.valueText}>
                Building a movement of conscious shoppers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Get in Touch</h2>
          <p className={styles.text} style={{ textAlign: 'center', marginBottom: '28px' }}>
            Have questions? We'd love to hear from you!
          </p>
          <div className={styles.contactInfo}>
            <div className={styles.contactLinks}>
              <a
                href="mailto:thirft.by.mk890@gmail.com"
                className={styles.contactIcon}
                aria-label="Email"
                title="Email"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/thrift.by.muskan/"
                target="_blank"
                rel="noreferrer"
                className={styles.contactIcon}
                aria-label="Instagram"
                title="Instagram"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17" cy="7" r="1.2" />
                </svg>
              </a>
              <a
                href="https://wa.me/9217919150"
                target="_blank"
                rel="noreferrer"
                className={styles.contactIcon}
                aria-label="WhatsApp"
                title="WhatsApp"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 11.5a8.5 8.5 0 0 1-12.9 7.3L3 21l2.4-4.8A8.5 8.5 0 1 1 21 11.5z" />
                  <path d="M9.5 9.5c.3-.6.5-.7.9-.7h.4c.1 0 .3 0 .4.3l.6 1.4c.1.2.1.4 0 .5l-.5.6c-.1.1-.1.2 0 .4a6 6 0 0 0 2.6 2.6c.2.1.3.1.4 0l.6-.5c.1-.1.3-.1.5 0l1.4.6c.2.1.3.2.3.4v.4c0 .4-.1.6-.7.9-.6.3-1.2.3-1.8.1-1.2-.4-2.3-1-3.3-2s-1.6-2.1-2-3.3c-.2-.6-.2-1.2.1-1.8z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
