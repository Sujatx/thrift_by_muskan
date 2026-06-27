import { ThemeProvider as NextThemesProvider } from 'next-themes'

/**
 * Theme provider for the admin surface. Persists choice to localStorage
 * and toggles `class="dark"` on <html>; admin dark tokens are scoped to
 * `.dark .admin-app`, so the storefront is unaffected.
 */
export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="thrift_admin_theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}

export { useTheme } from 'next-themes'
