import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { usePortalAuthStore } from '@/stores/portalAuthStore'
import { useHotelName, useHotelSettings } from '@/hooks/usePortalApi'
import { portalApi } from '@/lib/portalApi'
import { Menu, X, User, LogOut, ChevronDown, Calendar } from 'lucide-react'

export function PortalNavbar() {
  const { token, user, logout } = usePortalAuthStore()
  const hotelName = useHotelName()
  const hotel = useHotelSettings()
  const logoUrl = (hotel['hotel_logo'] as string | undefined) || ''
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setDropdownOpen(false)
  }, [location])

  const isActive = (path: string) => {
    if (path === '/public') return location.pathname === '/public'
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const linkClass = (path: string) =>
    `relative text-[12px] uppercase tracking-[0.2em] transition-colors duration-300 pb-1 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-gold after:transition-all after:duration-300 ${
      isActive(path)
        ? 'text-gold after:w-full'
        : 'text-white/50 hover:text-white after:w-0 hover:after:w-full'
    }`

  const [brandFirst, ...brandRest] = hotelName.split(' ')

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-dark/95 backdrop-blur-xl shadow-lg shadow-black/30'
        : 'bg-dark/70 backdrop-blur-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/public" className="flex flex-col items-start group">
            <div className="flex items-center gap-2.5">
              {logoUrl ? (
                <img src={logoUrl} alt={hotelName} className="h-9 w-auto max-w-[140px] object-contain" />
              ) : (
                <div className="w-5 h-5 border border-gold rotate-45 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-gold" />
                </div>
              )}
              <span className="font-serif text-[16px] sm:text-[18px] font-light text-gold tracking-[0.15em] transition-colors leading-tight">
                {brandFirst}<br />{brandRest.join(' ') || '\u00A0'}
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            <Link to="/public" className={linkClass('/public')}>Home</Link>
            <Link to="/public/rooms" className={linkClass('/public/rooms')}>Rooms</Link>
            <Link to="/public/gallery" className={linkClass('/public/gallery')}>Gallery</Link>
            <Link to="/public/contact" className={linkClass('/public/contact')}>Contact</Link>
            {token && (
              <Link to="/public/my-reservations" className={linkClass('/public/my-reservations')}>
                My Reservations
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-6">
            {token ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 text-white/70 hover:text-gold transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-dark border border-gold/30 flex items-center justify-center">
                    <User className="h-4 w-4 text-gold" />
                  </div>
                  <span className="text-[13px] font-medium">{user?.first_name}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-52 bg-dark border border-white/10 rounded-xl shadow-2xl py-2 animate-fade-in">
                    <Link to="/public/profile" className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-white/60 hover:text-gold hover:bg-white/5 transition-colors">
                      <User className="h-3.5 w-3.5" />
                      My Profile
                    </Link>
                    <Link to="/public/my-reservations" className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-white/60 hover:text-gold hover:bg-white/5 transition-colors">
                      <Calendar className="h-3.5 w-3.5" />
                      My Reservations
                    </Link>
                    <div className="my-2 border-t border-white/5" />
                    <button
                      onClick={() => { portalApi.post('/public/logout').catch(() => {}); logout(); setDropdownOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-white/60 hover:text-gold hover:bg-white/5 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 border border-gold/40 hover:border-gold px-4 py-2 rounded-lg text-[12px] text-gold uppercase tracking-[0.15em] transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  Guest
                  <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-44 bg-dark border border-white/10 rounded-xl shadow-2xl py-2 animate-fade-in">
                    <Link to="/public/login" className="block px-4 py-2.5 text-[13px] text-white/60 hover:text-gold hover:bg-white/5 transition-colors">
                      Sign In
                    </Link>
                    <Link to="/public/register" className="block px-4 py-2.5 text-[13px] text-white/60 hover:text-gold hover:bg-white/5 transition-colors">
                      Register
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white/60 hover:text-gold transition-colors">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-dark/98 backdrop-blur-xl border-t border-white/5 px-6 py-6 space-y-1 animate-fade-in">
          <MobileLink to="/public" active={isActive('/public')}>Home</MobileLink>
          <MobileLink to="/public/rooms" active={isActive('/public/rooms')}>Rooms</MobileLink>
          <MobileLink to="/public/gallery" active={isActive('/public/gallery')}>Gallery</MobileLink>
          <MobileLink to="/public/contact" active={isActive('/public/contact')}>Contact</MobileLink>
          {token && (
            <>
              <MobileLink to="/public/my-reservations" active={isActive('/public/my-reservations')}>My Reservations</MobileLink>
              <MobileLink to="/public/profile" active={isActive('/public/profile')}>Profile</MobileLink>
              <button onClick={logout} className="block w-full text-left text-white/40 hover:text-gold py-3.5 uppercase text-[12px] tracking-[0.15em] border-b border-white/5 transition-colors">
                Sign Out
              </button>
            </>
          )}
          {!token && (
            <div className="pt-4 pb-2 space-y-1">
              <Link to="/public/login" className="block text-white/50 hover:text-gold py-3 uppercase text-[12px] tracking-[0.15em] border-b border-white/5 transition-colors">
                Sign In
              </Link>
              <Link to="/public/register" className="block text-white/50 hover:text-gold py-3 uppercase text-[12px] tracking-[0.15em] border-b border-white/5 transition-colors">
                Register
              </Link>
            </div>
          )}
          <div className="pt-4 mt-2 border-t border-white/5">
            <a href="/login" className="block text-white/20 hover:text-gold py-2 text-[10px] uppercase tracking-[0.15em] transition-colors">
              Staff Portal
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}

function MobileLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`block py-3.5 uppercase text-[12px] tracking-[0.15em] border-b border-white/5 transition-colors ${
        active ? 'text-gold font-medium' : 'text-white/50 hover:text-gold'
      }`}
    >
      {children}
    </Link>
  )
}
