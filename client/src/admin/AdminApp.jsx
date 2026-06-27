import { Routes, Route, Navigate } from 'react-router-dom'
import './admin.css'
import { ThemeProvider } from './ThemeProvider'
import { ProtectedRoute } from './ProtectedRoute'
import { AdminLayout } from './AdminLayout'
import { Toaster } from '../components/ui/sonner'
import { TooltipProvider } from '../components/ui/tooltip'

import AdminLogin from '../pages/Admin/AdminLogin'
import ResetPassword from '../pages/Admin/ResetPassword'

import Overview from './pages/Overview'
import ProductsList from './pages/products/ProductsList'
import ProductForm from './pages/products/ProductForm'
import OrdersList from './pages/orders/OrdersList'
import BannersList from './pages/banners/BannersList'
import Settings from './pages/Settings'
import Team from './pages/team/Team'

/**
 * Self-contained admin surface mounted at /admin/*. Owns its own router,
 * theme, and toast layer, all scoped under `.admin-app` so the storefront
 * (DM Sans / Playfair, no Tailwind preflight) is unaffected.
 */
export default function AdminApp() {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={200}>
        <div className="admin-app">
          <Routes>
            {/* Public auth pages */}
            <Route path="login" element={<AdminLogin />} />
            <Route path="reset-password" element={<ResetPassword />} />

            {/* Protected dashboard */}
            <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/admin/overview" replace />} />
              <Route path="overview" element={<Overview />} />
              <Route path="products" element={<ProductsList />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/:id" element={<ProductForm />} />
              <Route path="orders" element={<OrdersList />} />
              <Route path="banners" element={<BannersList />} />
              <Route path="settings" element={<Settings />} />
              <Route path="team" element={<Team />} />
            </Route>

            <Route path="*" element={<Navigate to="/admin/overview" replace />} />
          </Routes>
          <Toaster />
        </div>
      </TooltipProvider>
    </ThemeProvider>
  )
}
