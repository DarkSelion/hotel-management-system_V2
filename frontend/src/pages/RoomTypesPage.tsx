import { useState, useMemo, useCallback } from 'react'
import { useRoomTypes, useCreateRoomType, useUpdateRoomType, useDeleteRoomType } from '@/hooks/useApi'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { Plus, Edit, Trash2, Loader2, Search } from 'lucide-react'

const BED_TYPES = ['Single', 'Double', 'Twin', 'Queen', 'King', 'Triple', 'Quad', 'Queen + Twin', 'California King']

const defaultForm = {
  name: '',
  description: '',
  base_price: '',
  capacity: '',
  size_sqm: '',
  bed_type: '',
}

export default function RoomTypesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortBy, setSortBy] = useState('id')
  const { addToast } = useToast()

  const { data: roomTypesData, isLoading, error, refetch } = useRoomTypes({ search: search || undefined, page, per_page: pageSize })
  const roomTypes = roomTypesData?.data ?? []
  const createRoomType = useCreateRoomType()
  const updateRoomType = useUpdateRoomType()
  const deleteRoomType = useDeleteRoomType()

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const handleSort = useCallback((key: string) => {
    setSortBy(prev => {
      if (prev === key) return `-${key}`
      if (prev === `-${key}`) return key
      return key
    })
  }, [])

  const sortedData = useMemo(() => {
    const sorted = [...roomTypes]
    const isDesc = sortBy.startsWith('-')
    const key = isDesc ? sortBy.slice(1) : sortBy
    sorted.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[key]
      const bVal = (b as unknown as Record<string, unknown>)[key]
      if (aVal == null) return 1
      if (bVal == null) return -1
      let cmp = 0
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        cmp = aVal.localeCompare(bVal)
      } else {
        cmp = Number(aVal) - Number(bVal)
      }
      return isDesc ? -cmp : cmp
    })
    return sorted
  }, [roomTypes, sortBy])

  const openCreate = () => {
    setModalMode('create')
    setEditId(null)
    setForm(defaultForm)
  }

  const openEdit = (rt: (typeof roomTypes)[number]) => {
    setModalMode('edit')
    setEditId(rt.id)
    setForm({
      name: rt.name,
      description: rt.description ?? '',
      base_price: String(rt.base_price),
      capacity: String(rt.capacity),
      size_sqm: rt.size_sqm != null ? String(rt.size_sqm) : '',
      bed_type: rt.bed_type ?? '',
    })
  }

  const handleSave = async () => {
    if (!form.name || !form.base_price || !form.capacity) {
      addToast('Please fill in all required fields', 'error')
      return
    }
    const payload = {
      name: form.name,
      description: form.description || null,
      base_price: Number(form.base_price),
      capacity: Number(form.capacity),
      size_sqm: form.size_sqm ? Number(form.size_sqm) : null,
      bed_type: form.bed_type || null,
    }
    try {
      if (modalMode === 'create') {
        await createRoomType.mutateAsync(payload)
        addToast('Room type created successfully', 'success')
      } else if (editId) {
        await updateRoomType.mutateAsync({ id: editId, data: payload })
        addToast('Room type updated successfully', 'success')
      }
      setModalMode(null)
    } catch {
      addToast('Failed to save room type', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmId) return
    try {
      await deleteRoomType.mutateAsync(deleteConfirmId)
      addToast('Room type deleted successfully', 'success')
      setDeleteConfirmId(null)
    } catch {
      addToast('Cannot delete room type with existing rooms', 'error')
    }
  }

  const columns: Column<(typeof roomTypes)[number]>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      render: (r) => <span className="font-medium">{r.id}</span>,
    },
    {
      key: 'name',
      label: 'Room Type',
      sortable: true,
      render: (r) => <span className="font-medium">{r.name}</span>,
    },
    {
      key: 'base_price',
      label: 'Room Price',
      sortable: true,
      render: (r) => <span>₱{Number(r.base_price).toLocaleString()}</span>,
    },
    {
      key: 'capacity',
      label: 'Capacity',
      sortable: true,
      render: (r) => <span>{r.capacity}</span>,
    },
    {
      key: 'size_sqm',
      label: 'Room Size (sqm)',
      sortable: true,
      render: (r) => <span>{r.size_sqm != null ? `${r.size_sqm} m²` : '-'}</span>,
    },
    {
      key: 'bed_type',
      label: 'Bed Type',
      sortable: true,
      render: (r) => <span>{r.bed_type ?? '-'}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" square onClick={() => openEdit(r)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" square onClick={() => setDeleteConfirmId(r.id)} className="text-danger hover:text-danger">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const isSaving = createRoomType.isPending || updateRoomType.isPending

  return (
    <div>
      <PageHeader
        title="Room List"
        description="Manage room categories, pricing, and capacity"
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="relative max-w-xs flex-1">
              <Input
                placeholder="Search room types..."
                icon={<Search className="h-4 w-4" />}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <Select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="w-32"
            >
              <option value={5}>5 entries</option>
              <option value={10}>10 entries</option>
              <option value={25}>25 entries</option>
              <option value={50}>50 entries</option>
              <option value={100}>100 entries</option>
            </Select>
            <Button variant="primary" onClick={openCreate} className="ml-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Room Type
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={sortedData}
            loading={isLoading}
            error={error ? 'Failed to load room types' : null}
            sortBy={sortBy}
            onSort={handleSort}
            keyExtractor={(r) => r.id}
            onRetry={refetch}
            pagination={roomTypesData ? {
              currentPage: roomTypesData.current_page,
              lastPage: roomTypesData.last_page,
              total: roomTypesData.total,
              from: roomTypesData.total ? (roomTypesData.current_page - 1) * roomTypesData.per_page + 1 : 0,
              to: roomTypesData.total ? Math.min(roomTypesData.current_page * roomTypesData.per_page, roomTypesData.total) : 0,
              onPageChange: setPage,
            } : undefined}
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={modalMode !== null}
        onClose={() => setModalMode(null)}
        title={modalMode === 'create' ? 'Add Room Type' : 'Edit Room Type'}
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modalMode === 'create' ? 'Create' : 'Update'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Room Type <span className="text-danger">*</span>
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Deluxe Room"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Capacity <span className="text-danger">*</span>
              </label>
              <Input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm(f => ({ ...f, capacity: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Room Price (₱) <span className="text-danger">*</span>
              </label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.base_price}
                onChange={(e) => setForm(f => ({ ...f, base_price: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Room Size (sqm)</label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.size_sqm}
                onChange={(e) => setForm(f => ({ ...f, size_sqm: e.target.value }))}
                placeholder="e.g. 28"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Bed Type</label>
              <Select
                value={form.bed_type}
                onChange={(e) => setForm(f => ({ ...f, bed_type: e.target.value }))}
              >
                <option value="">Select bed type</option>
                {BED_TYPES.map((bt) => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Room Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm placeholder:text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              placeholder="Describe the room type..."
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete Room Type"
        message="Are you sure you want to delete this room type? This action cannot be undone. Room types with existing rooms cannot be deleted."
        confirmLabel="Delete"
        isLoading={deleteRoomType.isPending}
      />
    </div>
  )
}
