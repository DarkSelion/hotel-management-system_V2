import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { PublicNavbar } from './PublicNavbar'
import { PublicFooter } from './PublicFooter'

export function PublicLayout() {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('home-theme-root')
    return () => root.classList.remove('home-theme-root')
  }, [])

  return (
    <div className="home-theme min-h-screen bg-dark">
      <PublicNavbar />
      <main className="pt-20">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
