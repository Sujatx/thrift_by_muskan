import styles from './Ticker.module.css'

const ITEMS = [
  'Pre-loved fashion',
  'Sustainable style',
  'Curated by hand',
  'Every piece has a story',
]

export default function Ticker() {
  const track = [...ITEMS, ...ITEMS]

  return (
    <div className={styles.ticker}>
      <div className={styles.track}>
        {track.map((item, i) => (
          <span key={i} className={styles.item}>
            {item}
            <span className={styles.dot} aria-hidden="true">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
