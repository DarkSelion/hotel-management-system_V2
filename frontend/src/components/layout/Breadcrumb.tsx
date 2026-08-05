import { useLocation, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

const labelMap: Record<string, string> = {
  dashboard: 'Dashboard',
  reservations: 'Reservations',
  guests: 'Guests',
  rooms: 'Rooms',
  'room-types': 'Room List',
  housekeeping: 'Housekeeping',
  maintenance: 'Maintenance',
  staff: 'Staff',
  customers: 'Customers',
  invoices: 'Invoices',
  payments: 'Payments',
  reports: 'Reports',
  calendar: 'Calendar',
  inventory: 'Inventory',
  settings: 'Settings',
  profile: 'Profile',
}

export function Breadcrumb() {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null

  return (
    <nav className="flex items-center gap-1 text-xs text-muted">
      <Link to="/dashboard" className="hover:text-gray-700 transition-colors">
        Home
      </Link>
      {segments.map((segment, index) => {
        const path = `/${segments.slice(0, index + 1).join('/')}`
        const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
        const isLast = index === segments.length - 1

        return (
          <span key={segment} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {isLast ? (
              <span className="text-gray-700 font-medium">{label}</span>
            ) : (
              <Link to={path} className="hover:text-gray-700 transition-colors">
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
