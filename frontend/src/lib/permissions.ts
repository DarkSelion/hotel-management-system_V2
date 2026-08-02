export const ADMIN_ROLES = ['super_admin', 'admin', 'hotel_manager'] as const

export type AdminRole = (typeof ADMIN_ROLES)[number]

export function isAdminRole(role?: string | null): boolean {
  return ADMIN_ROLES.includes(role as AdminRole)
}
