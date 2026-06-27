import { createContext, useContext, useState, useEffect } from 'react'
import { getStoreSettings } from '../services/api'

const StoreSettingsContext = createContext({
  settings: {
    storeName: 'Thrift by Muskan',
    email: '',
    whatsapp: '',
    instagram: '',
    footerTagline: 'Made with care in Delhi.',
    categories: ['tops', 'bottoms', 'dresses', 'accessories'],
  },
  loading: true,
  refresh: () => {},
})

export function StoreSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchSettings() {
    try {
      const res = await getStoreSettings()
      setSettings(res)
    } catch {
      // silent fail — defaults stay in context
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSettings() }, [])

  const value = {
    settings: settings ?? {
      storeName: 'Thrift by Muskan',
      email: 'thirft.by.mk890@gmail.com',
      whatsapp: '9217919150',
      instagram: 'https://www.instagram.com/thrift.by.muskan/',
      footerTagline: 'Made with care in Delhi.',
      categories: ['tops', 'bottoms', 'dresses', 'accessories'],
    },
    loading,
    refresh: fetchSettings,
  }

  return (
    <StoreSettingsContext.Provider value={value}>
      {children}
    </StoreSettingsContext.Provider>
  )
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext)
}
