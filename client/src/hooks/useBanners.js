import { useState, useEffect } from 'react'
import { getPublicBanners } from '../services/api'

export function useBanners(type = 'hero_main') {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublicBanners(type)
      .then(data => setBanners(Array.isArray(data) ? data : []))
      .catch(() => setBanners([]))
      .finally(() => setLoading(false))
  }, [type])

  return { banners, loading }
}
