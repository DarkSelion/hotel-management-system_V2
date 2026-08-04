import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Breadcrumb } from './Breadcrumb'
import { useAuthStore } from '../../stores/authStore'
import { isAdminRole } from '../../lib/permissions'
import { api } from '../../lib/api'
import { useRecentActivities, useSearch } from '../../hooks/useApi'
import {
  Menu,
  Search,
  Bell,
  LogOut,
  Settings,
  UserCircle,
  Users,
  Calendar,
  DoorOpen,
  BedDouble,
  X,
} from 'lucide-react'

import type { ActivityLog } from '../../types'

function getActivityRoute(activity: ActivityLog): string {
  const { module, action } = activity

  if (module === 'reservations') {
    if (action === 'checked_in') return '/check-in'
    if (action === 'checked_out') return '/check-out'
    return '/reservations'
  }

  const moduleRoutes: Record<string, string> = {
    guests: '/guests',
    payments: '/payments',
    invoices: '/invoices',
    housekeeping: '/housekeeping',
    maintenance: '/maintenance',
    expenses: '/expenses',
    staff: '/staff',
    room_types: '/room-types',
    rooms: '/rooms',
    auth: '/settings',
    settings: '/settings',
  }

  return moduleRoutes[module] ?? '/dashboard'
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  hotel_manager: 'Hotel Manager',
  receptionist: 'Receptionist',
  housekeeping: 'Housekeeping',
  cashier: 'Cashier',
  staff: 'Staff',
}

const TYPE_ICONS: Record<string, typeof Users> = {
  guest: Users,
  reservation: Calendar,
  room: DoorOpen,
  room_type: BedDouble,
}

const TYPE_COLORS: Record<string, string> = {
  guest: 'bg-blue-500/10 text-blue-600',
  reservation: 'bg-emerald-500/10 text-emerald-600',
  room: 'bg-amber-500/10 text-amber-600',
  room_type: 'bg-purple-500/10 text-purple-600',
}

interface NavbarProps {
  onToggleSidebar: () => void
  title?: string
}

function timeAgo(dateStr: string) {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function Navbar({ onToggleSidebar, title }: NavbarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const { data: activities } = useRecentActivities()
  const { data: searchData } = useSearch(searchQuery)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    if (showUserMenu || showNotifications || showResults) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu, showNotifications, showResults])

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const activityList = activities ?? []
  const results = searchData?.results ?? []

  function handleResultClick(route: string) {
    setShowResults(false)
    setSearchQuery('')
    navigate(route)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white/80 backdrop-blur-lg px-4 lg:px-6">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && (
          <h2 className="text-lg font-semibold text-gray-900 hidden sm:block">{title}</h2>
        )}
        <div className="hidden md:block">
          <Breadcrumb />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Search - Desktop */}
        <div ref={searchRef} className="hidden md:relative md:flex md:items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search guests, rooms, reservations..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowResults(e.target.value.length >= 2)
            }}
            onFocus={() => { if (searchQuery.length >= 2) setShowResults(true) }}
            className="h-9 w-64 rounded-lg border border-border bg-bg pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setShowResults(false) }}
              className="absolute right-2 text-muted hover:text-gray-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute right-0 top-full mt-1 w-96 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
              {results.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted">
                  No results found for "{searchQuery}"
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {results.map((result, i) => {
                    const Icon = TYPE_ICONS[result.type] || Search
                    return (
                      <button
                        key={`${result.type}-${result.id}-${i}`}
                        onClick={() => handleResultClick(result.route)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-border last:border-0"
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TYPE_COLORS[result.type] || 'bg-gray-100 text-gray-600'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
                          <p className="text-xs text-muted truncate">{result.subtitle}</p>
                        </div>
                        {result.badge && (
                          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            {result.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search - Mobile */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors md:hidden"
        >
          <Search className="h-5 w-5" />
        </button>

        {searchOpen && (
          <div ref={searchRef} className="absolute left-0 right-0 top-full z-50 bg-white border-b border-border p-3 shadow-lg md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                placeholder="Search..."
                autoFocus
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowResults(e.target.value.length >= 2)
                }}
                className="h-10 w-full rounded-lg border border-border bg-bg pl-9 pr-9 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setShowResults(false) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {showResults && results.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-border">
                {results.map((result, i) => {
                  const Icon = TYPE_ICONS[result.type] || Search
                  return (
                    <button
                      key={`${result.type}-${result.id}-${i}`}
                      onClick={() => { handleResultClick(result.route); setSearchOpen(false) }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 border-b border-border last:border-0"
                    >
                      <Icon className="h-4 w-4 text-muted shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
                        <p className="text-xs text-muted truncate">{result.subtitle}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {activityList.length > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                {activityList.length > 9 ? '9+' : activityList.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-1 w-80 rounded-lg border border-border bg-card shadow-lg">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h4 className="text-sm font-semibold text-gray-900">Notifications</h4>
                <span className="text-xs text-muted">{activityList.length} activities</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {activityList.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted">
                    No recent activities
                  </div>
                ) : (
                  activityList.map((activity) => (
                    <button
                      key={activity.id}
                      onClick={() => {
                        setShowNotifications(false)
                        navigate(getActivityRoute(activity))
                      }}
                      className="w-full text-left border-b border-border px-4 py-3 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <p className="text-sm text-gray-900">{activity.description ?? activity.action}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          {activity.module}
                        </span>
                        <span className="text-xs text-muted">{timeAgo(activity.created_at)}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-100 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900">{user?.name ?? 'Account'}</p>
              <p className="text-xs text-muted">{ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? ''}</p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-card py-1 shadow-lg">
              <div className="border-b border-border px-3 py-2">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-muted">{user?.email}</p>
              </div>
              <button onClick={() => { setShowUserMenu(false); navigate("/profile") }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <UserCircle className="h-4 w-4" />
                Profile
              </button>
              {isAdminRole(user?.role) && (
                <button onClick={() => { setShowUserMenu(false); navigate("/settings") }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
              )}
              <button
                onClick={() => { setShowUserMenu(false); api.post('/logout').catch(() => {}); logout() }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
