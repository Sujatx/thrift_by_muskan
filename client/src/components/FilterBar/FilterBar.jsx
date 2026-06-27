import styles from './FilterBar.module.css'

const DEFAULT_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'tops', label: 'Tops' },
  { value: 'bottoms', label: 'Bottoms' },
  { value: 'dresses', label: 'Dresses' },
  { value: 'accessories', label: 'Accessories' },
]

export default function FilterBar({
  activeFilter,
  onFilterChange,
  filters = DEFAULT_FILTERS,
}) {
  return (
    <div className={styles.filterBar}>
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`${styles.filterButton} ${
            activeFilter === filter.value ? styles.active : ''
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
