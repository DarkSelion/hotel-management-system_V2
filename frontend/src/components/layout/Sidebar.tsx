import {
  Building,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  LogIn,
  LogOut,
  ReceiptText,
  Settings,
  Users,
  Wrench,
  CalendarDays,
  Bed,
  ClipboardList,
  FileText,
  BarChart3,
  ShoppingCart,
  Package,
  Mail,
  ImageIcon,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { Tooltip } from '../ui/tooltip'
import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { isAdminRole } from '../../lib/permissions'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

interface MenuItem {
  label: string
  icon: React.ReactNode
  path?: string
  adminOnly?: boolean
  submenu?: MenuItem[]
}

interface SidebarSection {
  label: string
  items: MenuItem[]
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { sidebarCollapsed, isMobile, expandedMenus, toggleMenu } = useUIStore()
  const { user } = useAuthStore()
  const role = user?.role ?? 'staff'

  const sidebarSections: SidebarSection[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
      ],
    },
    {
      label: 'Hotel',
      items: [
        { label: 'All Rooms', icon: <Bed size={20} />, path: '/rooms' },
        { label: 'Reservations', icon: <CalendarDays size={20} />, path: '/reservations' },
        { label: 'Guests', icon: <Users size={20} />, path: '/guests' },
      ],
    },
    {
      label: 'Operations',
      items: [
        { label: 'Check In', icon: <LogIn size={20} />, path: '/check-in' },
        { label: 'Check Out', icon: <LogOut size={20} />, path: '/check-out' },
        { label: 'Housekeeping', icon: <ClipboardList size={20} />, path: '/housekeeping' },
        { label: 'Maintenance', icon: <Wrench size={20} />, path: '/maintenance' },
      ],
    },
    {
      label: 'Finance',
      items: [
        { label: 'Invoices', icon: <FileText size={20} />, path: '/invoices' },
        { label: 'Payments', icon: <ReceiptText size={20} />, path: '/payments' },
        { label: 'Expenses', icon: <ShoppingCart size={20} />, path: '/expenses', adminOnly: true },
      ],
    },
    {
      label: 'Reports',
      items: [
        { label: 'Reports', icon: <BarChart3 size={20} />, path: '/reports', adminOnly: true },
        { label: 'Inquiries', icon: <Mail size={20} />, path: '/inquiries', adminOnly: true },
      ],
    },
    {
      label: 'Settings',
      items: [
        { label: 'Staff', icon: <Users size={20} />, path: '/staff', adminOnly: true },
        {
          label: 'Hotel Settings',
          icon: <Settings size={20} />,
          adminOnly: true,
          submenu: [
            { label: 'Room List', icon: <Wrench size={16} />, path: '/room-list' },
            { label: 'Amenities', icon: <Package size={16} />, path: '/amenities' },
            { label: 'Room Images', icon: <ImageIcon size={16} />, path: '/room-images' },
          ],
        },
      ],
    },
  ]

  const renderNavLink = (item: MenuItem, sectionLabel: string) => {
    if (item.submenu) {
      const isOpen = Boolean(expandedMenus[sectionLabel])

      return (
        <Tooltip
          key={item.label}
          content={item.label}
          side="right"
          align="start"
        >
          {({ ref, onMouseEnter, onMouseLeave, onFocus, onBlur }) => (
            <button
              ref={ref as unknown as React.Ref<HTMLButtonElement>}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              onFocus={onFocus}
              onBlur={onBlur}
              onClick={() => !collapsed && toggleMenu(sectionLabel)}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                collapsed
                  ? 'justify-center px-3 py-3 hover:bg-[var(--color-sidebar-hover-bg)]'
                  : 'hover:translate-x-1 hover:bg-[var(--color-sidebar-hover-bg)]',
                !collapsed && isOpen
                  ? 'bg-[var(--color-sidebar-active-bg)] text-[var(--color-sidebar-active-text)]'
                  : 'text-[var(--color-sidebar-text)] hover:text-[var(--color-sidebar-active-text)]',
              )}
              aria-expanded={!collapsed && isOpen}
              aria-label={item.label}
            >
              {!collapsed && (
                <span className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              )}
              {collapsed && item.icon}
              {!collapsed && (
                <ChevronDown
                  size={16}
                  className={cn('transition-transform duration-200', isOpen && 'rotate-180')}
                />
              )}
            </button>
          )}
        </Tooltip>
      )
    }

    const shouldShow = !item.adminOnly || isAdminRole(role)

    if (!shouldShow) {
      return null
    }

    const baseClasses =
      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150'

    const activeClasses =
      'bg-[var(--color-sidebar-active-bg)] text-[var(--color-sidebar-active-text)] shadow-sm'
    const inactiveClasses =
      'text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover-bg)] hover:translate-x-1 hover:text-[var(--color-sidebar-active-text)]'

    return (
      <Tooltip key={item.path ?? item.label} content={item.label} side="right" align="start">
        {({ ref, onMouseEnter, onMouseLeave, onFocus, onBlur }) => (
          <NavLink
            ref={ref as unknown as React.Ref<HTMLAnchorElement>}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onFocus={onFocus}
            onBlur={onBlur}
            to={item.path ?? '#'}
            className={({ isActive }) =>
              cn(
                baseClasses,
                'group',
                collapsed ? 'justify-center px-3 py-3' : '',
                isActive ? activeClasses : inactiveClasses,
              )
            }
            aria-label={item.label}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        )}
      </Tooltip>
    )
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-bg)]',
        'transition-all duration-300 ease-in-out',
        isMobile
          ? cn(
              'w-64 shadow-xl',
              !sidebarCollapsed ? 'translate-x-0' : '-translate-x-full',
            )
          : collapsed
            ? 'w-16'
            : 'w-64',
      )}
      aria-label="Main navigation"
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 border-b border-[var(--color-sidebar-border)] p-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-white">
          <Building size={20} />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-[var(--color-sidebar-active-text)]">
              Pampanga Home Suites
            </span>
            <span className="text-xs text-[var(--color-sidebar-muted)]">Hotel Management System</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        {sidebarSections.map((section) => (
          <div key={section.label} className="mb-4">
            {/* Section Label */}
            {!collapsed && (
              <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-sidebar-muted)]">
                {section.label}
              </h3>
            )}
            {section.items
              .filter((item) => !item.adminOnly || isAdminRole(role))
              .map((item) => (
                <div key={item.label}>
                  {renderNavLink(item, section.label)}

                  {/* Submenu (expanded mode only) */}
                  {!collapsed && item.submenu && expandedMenus[section.label] && (
                    <div className="ml-6 space-y-1 border-l-2 border-transparent pl-2">
                      {item.submenu.map((sub) => (
                        <NavLink
                          key={sub.path}
                          to={sub.path ?? '#'}
                          className={cn(
                            'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150',
                            'text-[var(--color-sidebar-text)]',
                            'hover:bg-[var(--color-sidebar-hover-bg)] hover:text-[var(--color-sidebar-active-text)]',
                            'data-[active=true]:bg-[var(--color-sidebar-active-bg)] data-[active=true]:text-[var(--color-sidebar-active-text)]',
                          )}
                        >
                          {sub.icon}
                          <span>{sub.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        ))}
      </nav>

      {/* Bottom: Logout + Collapse Toggle */}
      <div className="border-t border-[var(--color-sidebar-border)] p-2">
        <Tooltip content={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} side="top" align="center">
          {({ ref, onMouseEnter, onMouseLeave, onFocus, onBlur }) => (
            <button
              ref={ref as unknown as React.Ref<HTMLButtonElement>}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              onFocus={onFocus}
              onBlur={onBlur}
              onClick={onToggle}
              className={cn(
                'flex w-full items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-sidebar-text)] transition-all duration-150',
                'hover:bg-[var(--color-sidebar-hover-bg)] hover:text-[var(--color-sidebar-active-text)]',
                collapsed ? '' : 'justify-start',
              )}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronRight
                size={18}
                className={cn(
                  'transition-transform duration-200',
                  collapsed ? 'rotate-0' : 'rotate-180',
                )}
              />
              {!collapsed && <span>Collapse</span>}
            </button>
          )}
        </Tooltip>

        <Tooltip content="Logout" side="top" align="center">
          {({ ref, onMouseEnter, onMouseLeave, onFocus, onBlur }) => (
            <button
              ref={ref as unknown as React.Ref<HTMLButtonElement>}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              onFocus={onFocus}
              onBlur={onBlur}
              onClick={() => {
                localStorage.removeItem('auth-storage')
                window.location.href = '/admin/login'
              }}
              className={cn(
                'mt-1 flex w-full items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-all duration-150',
                'hover:bg-red-50 hover:text-red-600',
                collapsed ? '' : 'justify-start',
              )}
              aria-label="Logout"
            >
              <LogOut size={18} />
              {!collapsed && <span>Logout</span>}
            </button>
          )}
        </Tooltip>
      </div>
    </aside>
  )
}
