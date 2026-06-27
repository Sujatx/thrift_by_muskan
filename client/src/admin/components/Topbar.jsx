import { useLocation } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { Moon, Sun, Monitor, LogOut, User, Menu } from 'lucide-react'
import { useTheme } from '../ThemeProvider'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../../components/ui/dropdown-menu'
import { NAV_ITEMS } from '../lib/nav'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const Icon = theme === 'dark' ? Sun : Moon
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Theme">
          <Icon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function usePageTitle() {
  const { pathname } = useLocation()
  const match = NAV_ITEMS.reduce((best, item) => {
    if (pathname.startsWith(item.to)) {
      if (!best || item.to.length > best.to.length) return item
    }
    return best
  }, null)
  return match?.label ?? 'Dashboard'
}

export function Topbar({ onMenuClick }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const pageTitle = usePageTitle()

  function handleLogout() {
    logout()
    navigate('/admin/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-background/80 px-4 backdrop-blur">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="mr-3 flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-accent hover:text-foreground sm:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      <span className="text-sm font-semibold">{pageTitle}</span>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Account">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Admin</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
              <User /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
