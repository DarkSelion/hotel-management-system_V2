import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { portalApi } from '@/lib/portalApi'
import { usePortalAuthStore } from '@/stores/portalAuthStore'
import type {
  PortalAuthResponse,
  PortalUser,
  PortalRoomType,
  PortalRoom,
  PortalReservationsResponse,
  PortalReservation,
} from '@/types'

// Auth
export function usePortalLogin() {
  const { setAuth } = usePortalAuthStore()
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      portalApi.post<PortalAuthResponse>('/public/login', data),
    onSuccess: (res) => {
      setAuth(res.token, res.user)
    },
  })
}

export function usePortalRegister() {
  const { setAuth } = usePortalAuthStore()
  return useMutation({
    mutationFn: (data: {
      first_name: string; last_name: string; email: string;
      phone: string; password: string; password_confirmation: string;
    }) => portalApi.post<PortalAuthResponse>('/public/register', data),
    onSuccess: (res) => {
      setAuth(res.token, res.user)
    },
  })
}

export function usePortalMe() {
  const token = usePortalAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['portal-me'],
    queryFn: () => portalApi.get<PortalUser>('/public/me'),
    enabled: !!token,
  })
}

// Room Types
export function usePortalRoomTypes(params?: Record<string, string | undefined>) {
  const query = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v) })
  }
  const qs = query.toString()
  return useQuery({
    queryKey: ['portal-room-types', params],
    queryFn: () => portalApi.get<PortalRoomType[]>('/public/rooms' + (qs ? '?' + qs : '')),
  })
}

export function usePortalRoomType(slug: string | undefined) {
  return useQuery({
    queryKey: ['portal-room-type', slug],
    queryFn: () => portalApi.get<PortalRoomType>('/public/rooms/' + slug),
    enabled: !!slug,
  })
}

export function usePortalAvailableRooms(params?: Record<string, string | undefined>) {
  const query = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v) })
  }
  const qs = query.toString()
  return useQuery({
    queryKey: ['portal-available-rooms', params],
    queryFn: () => portalApi.get<PortalRoom[]>('/public/rooms/available' + (qs ? '?' + qs : '')),
    enabled: !!params?.check_in && !!params?.check_out,
  })
}

// Reservations
export function usePortalReservations() {
  const token = usePortalAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['portal-reservations'],
    queryFn: () => portalApi.get<PortalReservationsResponse>('/public/reservations'),
    enabled: !!token,
  })
}

export function usePortalReservation(id: number | undefined) {
  const token = usePortalAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['portal-reservation', id],
    queryFn: () => portalApi.get<PortalReservation>('/public/reservations/' + id),
    enabled: !!token && !!id,
  })
}

export function usePortalCreateReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      room_type_id: number; check_in: string; check_out: string;
      adults: number; children?: number; special_requests?: string;
    }) => portalApi.post<PortalReservation>('/public/reservations', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-reservations'] })
    },
  })
}

export function usePortalCancelReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => portalApi.post<{ message: string }>('/public/reservations/' + id + '/cancel'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-reservations'] })
    },
  })
}

// Settings (public)
export function usePortalSettings(group: string) {
  return useQuery({
    queryKey: ['portal-settings', group],
    queryFn: () => portalApi.get<Record<string, unknown>>('/public/settings/' + group),
  })
}

export const DEFAULT_HOTEL_NAME = 'Pampanga Home Suites'

export function useHotelSettings(): Record<string, unknown> {
  const { data } = usePortalSettings('hotel')
  return (data ?? {}) as Record<string, unknown>
}

export function useHotelName(): string {
  const settings = useHotelSettings()
  const name = settings['hotel_name']
  return typeof name === 'string' && name.trim() ? name.trim() : DEFAULT_HOTEL_NAME
}

// Payments
export function usePortalCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      reservation_id: number; amount: number;
      payment_method: string; payment_type: string;
    }) => portalApi.post('/public/payments', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-reservations'] })
    },
  })
}

// Contact
export function usePortalSendContactMessage() {
  return useMutation({
    mutationFn: (data: { name: string; email: string; subject: string; message: string }) =>
      portalApi.post<{ message: string }>('/public/contact', data),
  })
}

// Profile
export function usePortalUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => portalApi.put<PortalUser>('/public/profile', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-me'] })
    },
  })
}

export function usePortalDeleteAccount() {
  const { logout } = usePortalAuthStore()
  return useMutation({
    mutationFn: () => portalApi.delete<{ message: string }>('/public/profile'),
    onSuccess: () => {
      logout()
    },
  })
}