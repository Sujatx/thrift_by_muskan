import * as React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'

export function AdminLayout() {
  const mainRef = React.useRef(null)
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  React.useLayoutEffect(() => {
    mainRef.current?.scrollTo(0, 0)
    setSidebarOpen(false)
  }, [pathname])

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        open={sidebarOpen}
        onOpen={() => setSidebarOpen(true)}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="ml-0 flex h-full flex-col sm:ml-[52px]">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
