import { useState } from 'react'
import { useRooms, useRoomTypes, useCreateRoom, useUpdateRoom, useUpdateRoomStatus, useDeleteRoom } from '@/hooks/useApi'
import type { Room } from '@/types'
import { formatCurrency } from '@/lib/format'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'

import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/authStore'
import { isAdminRole } from '@/lib/permissions'
import {
  Plus, Search, LayoutGrid, List, Users,
  Edit, Trash2, Save, RotateCcw, AlertCircle, DoorOpen,
  ChevronDown, MapPin, Maximize2
} from 'lucide-react'

const ROOM_STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'cleaning', label: 'Cleaning' },
]

const EDITABLE_STATUSES = ROOM_STATUS_OPTIONS.filter(
  o => o.value === 'available' || o.value === 'maintenance' || o.value === 'reserved',
)

const FLOOR_OPTIONS = [
  { value: '', label: 'All Floors' },
  { value: '1', label: 'Floor 1' },
  { value: '2', label: 'Floor 2' },
  { value: '3', label: 'Floor 3' },
]

const STATUS_COLORS: Record<string, string> = {
  available: 'border-l-4 border-l-green-500',
  occupied: 'border-l-4 border-l-red-500',
  maintenance: 'border-l-4 border-l-amber-500',
  reserved: 'border-l-4 border-l-blue-500',
  cleaning: 'border-l-4 border-l-gray-500',
}

interface RoomFormData {
  room_number: string
  room_type_id: number | ''
  floor: number | ''
  price_override: string
  status: string
  description: string
  notes: string
}

const defaultFormData: RoomFormData = {
  room_number: '',
  room_type_id: '',
  floor: '',
  price_override: '',
  status: 'available',
  description: '',
  notes: '',
}

export default function RoomsPage() {
  const [search, setSearch] = useState('')
  const role = useAuthStore((s) => s.user?.role ?? '')
  const isAdmin = isAdminRole(role)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState('')
  const [floorFilter, setFloorFilter] = useState('')
  const [roomTypeFilter, setRoomTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState('')

  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [formData, setFormData] = useState<RoomFormData>(defaultFormData)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof RoomFormData, string>>>({})

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [statusChangeConfirm, setStatusChangeConfirm] = useState<{ id: number; status: string } | null>(null)

  const params: Record<string, string | number | undefined> = {
    page: currentPage,
    per_page: 12,
    search: search || undefined,
    status: statusFilter || undefined,
    floor: floorFilter || undefined,
    room_type_id: roomTypeFilter || undefined,
    sort: sortBy || undefined,
  }

  const { data: roomsData, isLoading: roomsLoading, error: roomsError, refetch: refetchRooms } = useRooms(params)
  const { data: roomTypesData } = useRoomTypes(undefined, { enabled: isAdmin })
  const createRoom = useCreateRoom()
  const updateRoom = useUpdateRoom()
  const updateRoomStatus = useUpdateRoomStatus()
  const deleteRoom = useDeleteRoom()

  const rooms = roomsData?.data ?? []
  const paginationInfo = roomsData
    ? { currentPage: roomsData.current_page, lastPage: roomsData.last_page, total: roomsData.total, per_page: roomsData.per_page }
    : null
  const roomTypesList = roomTypesData?.data ?? []
  const selectedRoomType = roomTypesList.find((rt) => rt.id === formData.room_type_id)

  function getRoomTypeName(room: Room): string {
    return typeof room.room_type === 'object' ? room.room_type?.name ?? '-' : '-'
  }

  function getRoomTypeId(room: Room): number {
    return typeof room.room_type === 'object' ? room.room_type?.id : 0
  }

  function openAddModal() {
    setSelectedRoom(null)
    setFormData(defaultFormData)
    setFormErrors({})
    setModalMode('add')
  }

  function openEditModal(room: Room) {
    setSelectedRoom(room)
    setFormData({
      room_number: room.room_number,
      room_type_id: getRoomTypeId(room),
      floor: room.floor,
      price_override: room.price_override?.toString() ?? '',
      status: room.status,
      description: room.description ?? '',
      notes: '',
    })
    setFormErrors({})
    setModalMode('edit')
  }

  function closeModal() {
    setModalMode(null)
    setSelectedRoom(null)
  }

  function validateForm(): boolean {
    const errors: Partial<Record<keyof RoomFormData, string>> = {}
    if (!formData.room_number.trim()) errors.room_number = 'Room number is required'
    if (formData.room_type_id === '') errors.room_type_id = 'Room type is required'
    if (formData.floor === '') errors.floor = 'Floor is required'
    else if (Number(formData.floor) < 0) errors.floor = 'Floor must be 0 or greater'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm()) return

    const payload: Record<string, unknown> = {
      room_number: formData.room_number,
      room_type_id: formData.room_type_id,
      floor: Number(formData.floor),
      status: formData.status,
      description: formData.description || undefined,
    }
    if (formData.price_override) {
      payload.price_override = Number(formData.price_override)
    }

    if (modalMode === 'add') {
      createRoom.mutate(payload, {
        onSuccess: () => closeModal(),
      })
    } else if (selectedRoom) {
      updateRoom.mutate({ id: selectedRoom.id, data: payload }, {
        onSuccess: () => closeModal(),
      })
    }
  }

  function handleDelete() {
    if (!deleteConfirmId) return
    deleteRoom.mutate(deleteConfirmId, {
      onSuccess: () => setDeleteConfirmId(null),
    })
  }

  function handleQuickStatusChange(roomId: number, newStatus: string) {
    setStatusChangeConfirm({ id: roomId, status: newStatus })
  }

  function confirmStatusChange() {
    if (!statusChangeConfirm) return
    updateRoomStatus.mutate(
      { id: statusChangeConfirm.id, status: statusChangeConfirm.status },
      { onSuccess: () => setStatusChangeConfirm(null) },
    )
  }

  function updateField<K extends keyof RoomFormData>(key: K, value: RoomFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })
    }
  }

  function handleSort(key: string) {
    setSortBy((prev) => (prev === key ? `-${key}` : prev === `-${key}` ? '' : key))
  }

  function getPrice(room: Room): number {
    if (room.price_override != null) return Number(room.price_override)
    const rt = typeof room.room_type === 'object' ? room.room_type : null
    return rt ? Number(rt.base_price) : 0
  }

  const isMutating = createRoom.isPending || updateRoom.isPending

  const listColumns: Column<Room>[] = [
    {
      key: 'room_number',
      label: 'Room',
      sortable: true,
      render: (r) => (
        <span className="font-semibold text-gray-900">{r.room_number}</span>
      ),
    },
    {
      key: 'room_type',
      label: 'Room Type',
      sortable: true,
      render: (r) => <span className="text-muted">{getRoomTypeName(r)}</span>,
    },
    {
      key: 'floor',
      label: 'Floor',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-1.5 text-muted">
          <MapPin className="h-3.5 w-3.5" /> Floor {r.floor}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'cleaning_status',
      label: 'Cleaning',
      render: (r) => <StatusBadge status={r.cleaning_status ?? 'clean'} />,
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (r) => (
        <span className="font-medium text-gray-900">{formatCurrency(getPrice(r))}</span>
      ),
    },
    {
      key: 'capacity',
      label: 'Capacity',
      render: (r) => (
        <div className="flex items-center gap-1.5 text-muted">
          <Users className="h-3.5 w-3.5" /> {r.capacity}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          {isAdmin && (
            <>
              <Button variant="ghost" size="sm" square onClick={() => openEditModal(r)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" square onClick={() => setDeleteConfirmId(r.id)}>
                <Trash2 className="h-4 w-4 text-danger" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Rooms"
        description="Manage hotel rooms and their availability."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-border">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                square
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                square
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            {isAdmin && (
              <Button variant="gold" onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                Add Room
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative max-w-[200px] flex-1">
              <Input
                placeholder="Search room number..."
                icon={<Search className="h-4 w-4" />}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
              className="w-[140px]"
            >
              <option value="">All Status</option>
              {ROOM_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <Select
              value={floorFilter}
              onChange={(e) => { setFloorFilter(e.target.value); setCurrentPage(1) }}
              className="w-[130px]"
            >
              {FLOOR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            {isAdmin && (
              <Select
                value={roomTypeFilter}
                onChange={(e) => { setRoomTypeFilter(e.target.value); setCurrentPage(1) }}
                className="w-[160px]"
              >
                <option value="">All Types</option>
                {roomTypesList.map((rt) => (
                  <option key={rt.id} value={rt.id}>{rt.name}</option>
                ))}
              </Select>
            )}
          </div>

          {viewMode === 'grid' ? (
            roomsLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-5">
                      <Skeleton className="mb-3 h-6 w-16" />
                      <Skeleton className="mb-2 h-4 w-24" />
                      <Skeleton className="mb-4 h-4 w-20" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : roomsError ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border py-12">
                <AlertCircle className="mb-3 h-10 w-10 text-danger" />
                <p className="mb-2 text-sm font-medium text-gray-900">Something went wrong</p>
                <p className="mb-4 text-sm text-muted">{(roomsError as Error).message}</p>
                <Button variant="outline" onClick={() => refetchRooms()}>
                  <RotateCcw className="h-4 w-4" /> Retry
                </Button>
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border py-12">
                <DoorOpen className="mb-3 h-10 w-10 text-muted/50" />
                <p className="mb-1 text-sm font-medium text-gray-900">No rooms found</p>
                <p className="text-sm text-muted">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {rooms.map((room) => (
                    <Card key={room.id} className={STATUS_COLORS[room.status] ?? ''}>
                      <CardContent className="p-5">
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">{room.room_number}</p>
                            <p className="text-sm text-muted">{getRoomTypeName(room)}</p>
                          </div>
                          <StatusBadge status={room.status} />
                        </div>

                        <div className="mb-3 flex items-center gap-3 text-xs text-muted">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Floor {room.floor}
                          </span>
                          <span className="flex items-center gap-1">
                            <Maximize2 className="h-3 w-3" /> {room.capacity} guests
                          </span>
                        </div>

                        <div className="mb-4 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(getPrice(room))}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted">
                            <Users className="h-3 w-3" /> {room.capacity}
                          </span>
                        </div>

                        <div className="mb-3 flex items-center gap-2">
                          <StatusBadge status={room.cleaning_status ?? 'clean'} />
                        </div>

                        <div className="flex items-center gap-2 border-t border-border pt-3">
                          {isAdmin && (
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(room)}>
                              <Edit className="h-3.5 w-3.5" /> Edit
                            </Button>
                          )}
                          {isAdmin && (
                            <div className="relative">
                              <select
                                className="flex h-8 appearance-none rounded-lg border border-border bg-card px-3 pr-7 text-xs ring-offset-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) handleQuickStatusChange(room.id, e.target.value)
                                }}
                              >
                                <option value="" disabled>Status...</option>
                                {EDITABLE_STATUSES.filter((o) => o.value !== room.status).map((o) => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {paginationInfo && paginationInfo.lastPage > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted">
                      Page {paginationInfo.currentPage} of {paginationInfo.lastPage}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={paginationInfo.currentPage <= 1}
                        onClick={() => setCurrentPage(paginationInfo.currentPage - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={paginationInfo.currentPage >= paginationInfo.lastPage}
                        onClick={() => setCurrentPage(paginationInfo.currentPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )
          ) : (
            <DataTable
              columns={listColumns}
              data={rooms}
              loading={roomsLoading}
              error={roomsError ? (roomsError as Error).message : null}
              onSearch={undefined}
              sortBy={sortBy}
              onSort={handleSort}
              onRetry={() => refetchRooms()}
              keyExtractor={(r) => r.id}
              pagination={paginationInfo ? {
                currentPage: paginationInfo.currentPage,
                lastPage: paginationInfo.lastPage,
                total: paginationInfo.total,
                from: paginationInfo.total ? (paginationInfo.currentPage - 1) * paginationInfo.per_page + 1 : 0,
                to: paginationInfo.total ? Math.min(paginationInfo.currentPage * paginationInfo.per_page, paginationInfo.total) : 0,
                onPageChange: setCurrentPage,
              } : undefined}
            />
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'add' ? 'Add Room' : 'Edit Room'}
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={closeModal} disabled={isMutating}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleSubmit} disabled={isMutating}>
              {isMutating ? 'Saving...' : <><Save className="h-4 w-4" /> Save</>}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Room Number"
              placeholder="101"
              value={formData.room_number}
              onChange={(e) => updateField('room_number', e.target.value)}
              error={formErrors.room_number}
            />
            <Select
              label="Room Type"
              placeholder="Select type"
              value={formData.room_type_id}
              onChange={(e) => updateField('room_type_id', e.target.value ? Number(e.target.value) : '')}
              error={formErrors.room_type_id}
            >
              {roomTypesList.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.name} ({formatCurrency(Number(rt.base_price))})</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Floor"
              type="number"
              min={0}
              placeholder="1"
              value={formData.floor === '' ? '' : formData.floor}
              onChange={(e) => updateField('floor', e.target.value ? Number(e.target.value) : '')}
              error={formErrors.floor}
            />
            <Input
              label="Price Override"
              type="number"
              min={0}
              step="0.01"
              placeholder={selectedRoomType ? `${selectedRoomType.base_price}` : 'Auto'}
              value={formData.price_override}
              onChange={(e) => updateField('price_override', e.target.value)}
            />
          </div>

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => updateField('status', e.target.value)}
          >
            {EDITABLE_STATUSES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm ring-offset-card placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
              placeholder="Room description..."
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm ring-offset-card placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
              placeholder="Internal notes..."
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete Room"
        message="Are you sure you want to delete this room? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteRoom.isPending}
      />

      <ConfirmDialog
        isOpen={statusChangeConfirm !== null}
        onClose={() => setStatusChangeConfirm(null)}
        onConfirm={confirmStatusChange}
        title="Change Room Status"
        message={`Are you sure you want to change this room's status to "${statusChangeConfirm?.status}"?`}
        variant="warning"
        confirmLabel="Change Status"
        isLoading={updateRoomStatus.isPending}
      />
    </div>
  )
}
