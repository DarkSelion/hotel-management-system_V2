import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SidebarSection = string

interface UIState {
  sidebarCollapsed: boolean
  isMobile: boolean
  expandedMenus: Record<string, boolean>
  toggleSidebar: () => void
  setMobile: (val: boolean) => void
  toggleMenu: (section: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      isMobile: false,
      expandedMenus: {},
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setMobile: (val) => set({ isMobile: val }),
      toggleMenu: (section) =>
        set((state) => ({
          expandedMenus: {
            ...state.expandedMenus,
            [section]: !state.expandedMenus[section],
          },
        })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        expandedMenus: state.expandedMenus,
      }),
    },
  ),
)
