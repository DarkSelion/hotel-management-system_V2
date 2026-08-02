import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { PortalNavbar } from './PortalNavbar'
import { PortalFooter } from './PortalFooter'

export function PortalLayout() {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('home-theme-root')
    return () => root.classList.remove('home-theme-root')
  }, [])

  return (
    <div className="home-theme min-h-screen bg-dark">
      <PortalNavbar />
      <main className="pt-20">
        <Outlet />
      </main>
      <PortalFooter />
    </div>
  )
}
