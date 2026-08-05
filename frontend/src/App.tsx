import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { PortalLayout } from './components/portal/PortalLayout'
import { LoginPage } from './pages/admin/LoginPage'
import { useAuthStore } from './stores/authStore'
import { usePortalAuthStore } from './stores/portalAuthStore'
import { isAdminRole } from './lib/permissions'
import { ToastProvider } from './components/ui/toast'

const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const ReservationsPage = lazy(() => import('./pages/admin/ReservationsPage'))
const CheckInPage = lazy(() => import('./pages/admin/CheckInPage'))
const CheckOutPage = lazy(() => import('./pages/admin/CheckOutPage'))
const GuestsPage = lazy(() => import('./pages/admin/GuestsPage'))
const RoomsPage = lazy(() => import('./pages/admin/RoomsPage'))
const HousekeepingPage = lazy(() => import('./pages/admin/HousekeepingPage'))
const MaintenancePage = lazy(() => import('./pages/admin/MaintenancePage'))
const StaffPage = lazy(() => import('./pages/admin/StaffPage'))
const InvoicesPage = lazy(() => import('./pages/admin/InvoicesPage'))
const PaymentsPage = lazy(() => import('./pages/admin/PaymentsPage'))
const ExpensesPage = lazy(() => import('./pages/admin/ExpensesPage'))
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'))
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'))
const InquiriesPage = lazy(() => import('./pages/admin/InquiriesPage'))
const ProfilePage = lazy(() => import('./pages/admin/ProfilePage'))
const RoomTypesPage = lazy(() => import('./pages/admin/RoomTypesPage'))
const AmenitiesPage = lazy(() => import('./pages/admin/AmenitiesPage'))
const RoomImagesPage = lazy(() => import('./pages/admin/RoomImagesPage'))

const PortalHomePage = lazy(() => import('./pages/public/PortalHomePage'))
const PortalRoomsPage = lazy(() => import('./pages/public/PortalRoomsPage'))
const PortalRoomDetailPage = lazy(() => import('./pages/public/PortalRoomDetailPage'))
const PortalBookingPage = lazy(() => import('./pages/public/PortalBookingPage'))
const PortalLoginPage = lazy(() => import('./pages/public/PortalLoginPage'))
const PortalRegisterPage = lazy(() => import('./pages/public/PortalRegisterPage'))
const PortalMyReservationsPage = lazy(() => import('./pages/public/PortalMyReservationsPage'))
const PortalProfilePage = lazy(() => import('./pages/public/PortalProfilePage'))
const PortalGalleryPage = lazy(() => import('./pages/public/PortalGalleryPage'))
const PortalContactPage = lazy(() => import('./pages/public/PortalContactPage'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireRole({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (!isAdminRole(user?.role)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function ProtectedPortalRoute({ children }: { children: React.ReactNode }) {
  const { token } = usePortalAuthStore()
  if (!token) return <Navigate to="/portal/login" replace />
  return <>{children}</>
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )
}

export default function App() {
  const navigate = useNavigate()

  useEffect(() => {
    function handleUnauthorized() {
      navigate('/login', { replace: true })
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [navigate])

  return (
    <ToastProvider>
      <Routes>
        {/* Admin routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
          <Route path="reservations" element={<Suspense fallback={<PageLoader />}><ReservationsPage /></Suspense>} />
          <Route path="check-in" element={<Suspense fallback={<PageLoader />}><CheckInPage /></Suspense>} />
          <Route path="check-out" element={<Suspense fallback={<PageLoader />}><CheckOutPage /></Suspense>} />
          <Route path="guests" element={<Suspense fallback={<PageLoader />}><GuestsPage /></Suspense>} />
          <Route path="rooms" element={<Suspense fallback={<PageLoader />}><RoomsPage /></Suspense>} />
          <Route path="room-list" element={<Suspense fallback={<PageLoader />}><RoomsPage /></Suspense>} />
          <Route path="room-types" element={<RequireRole><Suspense fallback={<PageLoader />}><RoomTypesPage /></Suspense></RequireRole>} />
          <Route path="amenities" element={<RequireRole><Suspense fallback={<PageLoader />}><AmenitiesPage /></Suspense></RequireRole>} />
          <Route path="room-images" element={<RequireRole><Suspense fallback={<PageLoader />}><RoomImagesPage /></Suspense></RequireRole>} />
          <Route path="housekeeping" element={<Suspense fallback={<PageLoader />}><HousekeepingPage /></Suspense>} />
          <Route path="maintenance" element={<Suspense fallback={<PageLoader />}><MaintenancePage /></Suspense>} />
          <Route path="staff" element={<RequireRole><Suspense fallback={<PageLoader />}><StaffPage /></Suspense></RequireRole>} />
          <Route path="invoices" element={<Suspense fallback={<PageLoader />}><InvoicesPage /></Suspense>} />
          <Route path="payments" element={<Suspense fallback={<PageLoader />}><PaymentsPage /></Suspense>} />
          <Route path="expenses" element={<RequireRole><Suspense fallback={<PageLoader />}><ExpensesPage /></Suspense></RequireRole>} />
          <Route path="reports" element={<RequireRole><Suspense fallback={<PageLoader />}><ReportsPage /></Suspense></RequireRole>} />
          <Route path="inquiries" element={<RequireRole><Suspense fallback={<PageLoader />}><InquiriesPage /></Suspense></RequireRole>} />
          <Route path="settings" element={<RequireRole><Suspense fallback={<PageLoader />}><SettingsPage /></Suspense></RequireRole>} />
          <Route path="profile" element={<Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>} />
        </Route>

        {/* Guest Portal routes */}
        <Route path="/portal" element={
          <Suspense fallback={<PageLoader />}><PortalLayout /></Suspense>
        }>
          <Route index element={<Suspense fallback={<PageLoader />}><PortalHomePage /></Suspense>} />
          <Route path="rooms" element={<Suspense fallback={<PageLoader />}><PortalRoomsPage /></Suspense>} />
          <Route path="rooms/:slug" element={<Suspense fallback={<PageLoader />}><PortalRoomDetailPage /></Suspense>} />
          <Route path="book" element={
            <ProtectedPortalRoute><Suspense fallback={<PageLoader />}><PortalBookingPage /></Suspense></ProtectedPortalRoute>
          } />
          <Route path="my-reservations" element={
            <ProtectedPortalRoute><Suspense fallback={<PageLoader />}><PortalMyReservationsPage /></Suspense></ProtectedPortalRoute>
          } />
          <Route path="profile" element={
            <ProtectedPortalRoute><Suspense fallback={<PageLoader />}><PortalProfilePage /></Suspense></ProtectedPortalRoute>
          } />
          <Route path="gallery" element={<Suspense fallback={<PageLoader />}><PortalGalleryPage /></Suspense>} />
          <Route path="contact" element={<Suspense fallback={<PageLoader />}><PortalContactPage /></Suspense>} />
        </Route>
        <Route path="/portal/login" element={<Suspense fallback={<PageLoader />}><PortalLoginPage /></Suspense>} />
        <Route path="/portal/register" element={<Suspense fallback={<PageLoader />}><PortalRegisterPage /></Suspense>} />
      </Routes>
    </ToastProvider>
  )
}