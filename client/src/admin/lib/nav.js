import {
  LayoutDashboard,
  Shirt,
  ReceiptText,
  GalleryHorizontalEnd,
  Settings,
  Users,
} from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Shirt },
  { to: '/admin/orders', label: 'Orders', icon: ReceiptText },
  { to: '/admin/banners', label: 'Banners', icon: GalleryHorizontalEnd },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/team', label: 'Team', icon: Users },
]
