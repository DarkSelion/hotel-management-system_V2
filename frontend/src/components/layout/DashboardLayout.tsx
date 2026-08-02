import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { useUIStore } from '../../stores/uiStore'

export function DashboardLayout() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const isMobile = useUIStore((s) => s.isMobile)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const setMobile = useUIStore((s) => s.setMobile)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('home-theme-root')

    const checkMobile = () => {
      const mobile = window.matchMedia('(max-width: 1023px)').matches
      setMobile(mobile)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => {
      root.classList.remove('home-theme-root')
      window.removeEventListener('resize', checkMobile)
    }
  }, [setMobile])

  return (
    <div className="relative min-h-screen bg-bg">
      {/* Mobile backdrop overlay */}
      {isMobile && !sidebarCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />

      <div
        className={cn(
          'flex flex-col transition-all duration-300',
          isMobile
            ? 'ml-0 lg:ml-64 lg:group-[]/sidebar:ml-16'
            : sidebarCollapsed
              ? 'ml-16'
              : 'ml-64',
        )}
      >
        <Navbar onToggleSidebar={toggleSidebar} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
