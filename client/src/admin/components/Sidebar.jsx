import { NavLink } from 'react-router-dom'
import { PanelLeft } from 'lucide-react'
import { NAV_ITEMS } from '../lib/nav'
import { cn } from '../../lib/utils'

/* ── Strip nav item: icon + CSS-only tooltip ──────────────────────── */
function StripNavItem({ to, label, icon: Icon }) {
  return (
    <div className="group relative flex items-center justify-center">
      <NavLink
        to={to}
        onClick={e => e.stopPropagation()}
        className={({ isActive }) =>
          cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
            isActive
              ? 'text-foreground hover:bg-foreground/10'
              : 'text-foreground/70 hover:bg-foreground/10 hover:text-foreground'
          )
        }
      >
        <Icon className="h-4 w-4" />
      </NavLink>

      {/* Tooltip — CSS-only, appears to the right of the strip */}
      <div className="pointer-events-none absolute left-full top-1/2 z-[70] ml-2 hidden -translate-y-1/2 group-hover:block">
        <div className="whitespace-nowrap rounded-full border border-white/10 bg-neutral-900 px-2.5 py-1 text-xs text-white shadow-lg">
          {label}
        </div>
      </div>
    </div>
  )
}

/* ── Overlay panel nav item ───────────────────────────────────────── */
function PanelNavItem({ to, label, icon: Icon, onClose }) {
  return (
    <NavLink
      to={to}
      onClick={onClose}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors',
          isActive
            ? 'bg-accent text-foreground'
            : 'text-foreground/60 hover:bg-accent hover:text-foreground'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </>
      )}
    </NavLink>
  )
}

/* ── Sidebar: strip (desktop only) + overlay panel ─────────────────── */
export function Sidebar({ open, onOpen, onClose }) {
  return (
    <>
      {/* ── Layer 1: Icon strip — desktop only (sm+) ─────────────────
          Hidden on mobile; hamburger in Topbar handles that instead. */}
      <div
        className="fixed left-0 top-0 z-50 hidden h-full w-[52px] cursor-pointer flex-col items-center gap-1 border-r border-border/60 bg-sidebar py-3 sm:flex"
        onClick={onOpen}
      >
        <button
          className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
          onClick={onOpen}
          aria-label="Open navigation"
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        {NAV_ITEMS.map(item => (
          <StripNavItem key={item.to} {...item} />
        ))}
      </div>

      {/* ── Layer 2: Overlay panel ───────────────────────────────────── */}
      <div
        className={cn(
          'fixed left-0 top-0 z-[60] flex h-full w-[252px] flex-col border-r border-border/60 bg-sidebar shadow-2xl',
          'transition-transform duration-200 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        )}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border/60 px-3">
          <span className="text-sm font-semibold">Dashboard</span>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 p-2">
          {NAV_ITEMS.map(item => (
            <PanelNavItem key={item.to} {...item} onClose={onClose} />
          ))}
        </nav>
      </div>

      {/* ── Backdrop — closes panel when clicking outside ────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-[55]"
          onClick={onClose}
        />
      )}
    </>
  )
}
