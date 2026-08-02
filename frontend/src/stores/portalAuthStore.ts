import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PortalUser {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  address?: string
  city?: string
  country?: string
  nationality?: string
  date_of_birth?: string
  gender?: string
  is_vip?: boolean
  is_blacklisted?: boolean
}

interface PortalAuthState {
  token: string | null
  user: PortalUser | null
  setAuth: (token: string, user: PortalUser) => void
  logout: () => void
}

// SECURITY: Token is stored in localStorage via zustand/persist middleware.
// For production, consider encrypting the token or using httpOnly cookies.
export const usePortalAuthStore = create<PortalAuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'portal-auth-storage' },
  ),
)
