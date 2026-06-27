import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import CartSidebar from './components/CartSidebar/CartSidebar'
import CheckoutModal from './components/CheckoutModal/CheckoutModal'
import Toast from './components/Toast/Toast'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home/Home'
import About from './pages/About/About'
import AdminApp from './admin/AdminApp'
import NotFound from './pages/NotFound'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { StoreSettingsProvider } from './context/StoreSettingsContext'
import { Analytics } from "@vercel/analytics/react"

function AppLayout() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <>
      <ScrollToTop />
      <ToastProvider>
        <AuthProvider>
          <StoreSettingsProvider>
            <CartProvider>
              {isAdminRoute ? (
                /* Admin renders OUTSIDE `.storefront-app` so the storefront's
                   scoped base styles never bleed into the dashboard. */
                <Routes>
                  <Route path="/admin/*" element={<AdminApp />} />
                </Routes>
              ) : (
                <div className="storefront-app">
                  <Navbar onCartClick={() => setIsCartOpen(true)} />
                  <CartSidebar
                    isOpen={isCartOpen}
                    onClose={() => setIsCartOpen(false)}
                    onCheckout={() => {
                      setIsCartOpen(false)
                      setIsCheckoutOpen(true)
                    }}
                  />
                  <CheckoutModal
                    isOpen={isCheckoutOpen}
                    onClose={() => setIsCheckoutOpen(false)}
                  />
                  <Toast />
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <Analytics />
                </div>
              )}
            </CartProvider>
          </StoreSettingsProvider>
        </AuthProvider>
      </ToastProvider>
    </>
  )
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  )
}

export default App
