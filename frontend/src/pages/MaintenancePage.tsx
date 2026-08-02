import { useState } from 'react'
import {
  useMaintenanceRequests, useCreateMaintenanceRequest, useUpdateMaintenanceStatus,
  useAssignMaintenanceRequest, useStaffAssignable, useRooms,
} from '@/hooks/useApi'
import type { MaintenanceRequest } from '@/types'
import { formatCurrency, formatDateDisplay } from '@/lib/format'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { RowActions, RowActionButton } from '@/components/shared/RowActions'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import { isAdminRole } from '@/lib/permissions'
import { Plus, Search, Eye, Image, Clock, DollarSign, User } from 'lucide-react'

const CATEGORY_OPTIONS = [
  { value: 'Plumbing', label: 'Plumbing' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'HVAC', label: 'HVAC' },
  { value: 'Furniture', label: 'Furniture' },
  { value: 'Painting', label: 'Painting' },
  { value: 'Appliance', label: 'Appliance' },
  { value: 'Other', label: 'Other' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'reported', label: 'Reported' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const CATEGORY_BADGE: Record<string, 'default' | 'info' | 'warning' | 'danger'> = {
  Plumbing: 'info',
  Electrical: 'danger',
  HVAC: 'warning',
  Furniture: 'default',
  Painting: 'info',
  Appliance: 'warning',
  Other: 'default',
}

function formatCurrencyOrNull(amount?: number) {
  if (amount == null) return '—'
  return formatCurrency(amount)
}

export default function MaintenancePage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState('')

  const role = useAuthStore((s) => s.user?.role ?? '')
  const isAdmin = isAdminRole(role)

  const [showNewModal, setShowNewModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)

  const [formData, setFormData] = useState({
    room_id: '',
    title: '',
    description: '',
    category: '',
    priority: 'normal',
    notes: '',
  })

  const [assignStaffId, setAssignStaffId] = useState('')
  const [estimatedCost, setEstimatedCost] = useState('')

  const params: Record<string, string | number | undefined> = {
    search: search || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    category: categoryFilter || undefined,
    sort: sortBy || undefined,
  }

  const { data: requestsData, isLoading, error, refetch } = useMaintenanceRequests(params)
  const { data: staffData } = useStaffAssignable()
  const { data: roomsData } = useRooms({ all: 'true' })

  const createRequest = useCreateMaintenanceRequest()
  const updateStatus = useUpdateMaintenanceStatus()
  const assignRequest = useAssignMaintenanceRequest()

  const requests = requestsData?.data ?? []
  const staff = staffData ?? []
  const rooms = roomsData?.data ?? []

  function openNewModal() {
    setFormData({ room_id: '', title: '', description: '', category: '', priority: 'normal', notes: '' })
    setShowNewModal(true)
  }

  function openDetailModal(req: MaintenanceRequest) {
    setSelectedRequest(req)
    setShowDetailModal(true)
  }

  function openAssignModal(req: MaintenanceRequest) {
    setSelectedRequest(req)
    setAssignStaffId(req.assigned_to?.id?.toString() ?? '')
    setEstimatedCost(req.estimated_cost?.toString() ?? '')
    setShowAssignModal(true)
  }

  function handleCreate() {
    const payload: Record<string, unknown> = {
      room_id: Number(formData.room_id),
      title: formData.title,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
    }
    if (formData.notes) payload.notes = formData.notes
    createRequest.mutate(payload, { onSuccess: () => setShowNewModal(false) })
  }

  function handleAssign() {
    if (!selectedRequest || !assignStaffId) return
    assignRequest.mutate(
      { id: selectedRequest.id, assigned_to: Number(assignStaffId), estimated_cost: estimatedCost ? Number(estimatedCost) : undefined },
      { onSuccess: () => setShowAssignModal(false) },
    )
  }

  function handleQuickAction(requestId: number, status: string) {
    updateStatus.mutate({ id: requestId, status })
  }

  const columns: Column<MaintenanceRequest>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      render: (r) => <span className="font-mono text-xs text-muted">#{r.id}</span>,
    },
    {
      key: 'room',
      label: 'Room #',
      sortable: true,
      render: (r) => <span className="font-semibold">{r.room.room_number}</span>,
    },
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (r) => (
        <button onClick={() => openDetailModal(r)} className="text-left text-primary hover:underline">
          {r.title}
        </button>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (r) => (
        <Badge variant={CATEGORY_BADGE[r.category] ?? 'default'} size="sm">
          {r.category}
        </Badge>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (r) => <StatusBadge status={r.priority} />,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'assigned_to',
      label: 'Assigned To',
      render: (r) => (
        <span className="text-muted">{r.assigned_to ? r.assigned_to.name : '—'}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Reported Date',
      sortable: true,
      render: (r) => <span className="text-muted">{r.created_at ? formatDateDisplay(r.created_at) : '-'}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <RowActions>
          <RowActionButton
            tone="neutral"
            title="View"
            icon={<Eye className="h-4 w-4" />}
            onClick={() => openDetailModal(r)}
          />
          {isAdmin && r.status === 'reported' && (
            <RowActionButton
              tone="info"
              title="Assign"
              label="Assign"
              icon={<User className="h-4 w-4" />}
              onClick={() => openAssignModal(r)}
            />
          )}
          {isAdmin && r.status === 'assigned' && (
            <RowActionButton
              tone="success"
              title="Start Work"
              label="Start Work"
              onClick={() => handleQuickAction(r.id, 'in_progress')}
            />
          )}
          {isAdmin && r.status === 'in_progress' && (
            <RowActionButton
              tone="success"
              title="Complete"
              label="Complete"
              onClick={() => handleQuickAction(r.id, 'completed')}
            />
          )}
          {isAdmin && (r.status === 'reported' || r.status === 'assigned' || r.status === 'in_progress') && (
            <RowActionButton
              tone="danger"
              title="Cancel"
              label="Cancel"
              onClick={() => handleQuickAction(r.id, 'cancelled')}
            />
          )}
        </RowActions>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description="Manage maintenance requests and work orders."
        actions={
          <Button variant="gold" onClick={openNewModal}>
            <Plus className="h-4 w-4" />
            Report Issue
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative max-w-[200px] flex-1">
              <Input
                placeholder="Search room or title..."
                icon={<Search className="h-4 w-4" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-[140px]">
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
            <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-[130px]">
              {PRIORITY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-[150px]">
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={requests}
            loading={isLoading}
            error={error ? (error as Error).message : null}
            sortBy={sortBy}
            onSort={setSortBy}
            onRetry={() => refetch()}
            keyExtractor={(r) => r.id}
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Report Maintenance Issue"
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowNewModal(false)} disabled={createRequest.isPending}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleCreate} disabled={createRequest.isPending}>
              {createRequest.isPending ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Room"
            placeholder="Select a room"
            value={formData.room_id}
            onChange={(e) => setFormData(f => ({ ...f, room_id: e.target.value }))}
          >
            {rooms.map(r => (
              <option key={r.id} value={r.id}>{r.room_number} — {r.room_type?.name ?? ''}</option>
            ))}
          </Select>
          <Input
            label="Title"
            placeholder="Brief description of the issue"
            value={formData.title}
            onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="flex min-h-[100px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm ring-offset-card placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
              placeholder="Detailed description of the issue..."
              value={formData.description}
              onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              placeholder="Select category"
              value={formData.category}
              onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))}
            >
              {CATEGORY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
            <Select
              label="Priority"
              value={formData.priority}
              onChange={(e) => setFormData(f => ({ ...f, priority: e.target.value }))}
            >
              {PRIORITY_OPTIONS.filter(o => o.value).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm ring-offset-card placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
              placeholder="Internal notes..."
              value={formData.notes}
              onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Technician"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleAssign} disabled={!assignStaffId}>
              Confirm
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Assign technician to {selectedRequest?.title} (Room {selectedRequest?.room.room_number})
          </p>
          <Select
            label="Technician"
            placeholder="Select staff"
            value={assignStaffId}
            onChange={(e) => setAssignStaffId(e.target.value)}
          >
            {staff.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
          <Input
            label="Estimated Cost (₱)"
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
          />
        </div>
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Maintenance Request Details"
        size="xl"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>Close</Button>
            {isAdmin && selectedRequest?.status === 'reported' && (
              <Button variant="primary" onClick={() => { setShowDetailModal(false); selectedRequest && openAssignModal(selectedRequest) }}>
                <User className="h-4 w-4" /> Assign Technician
              </Button>
            )}
            {isAdmin && selectedRequest?.status === 'assigned' && (
              <Button variant="primary" onClick={() => selectedRequest && handleQuickAction(selectedRequest.id, 'in_progress')}>
                Start Work
              </Button>
            )}
            {isAdmin && selectedRequest?.status === 'in_progress' && (
              <Button variant="primary" onClick={() => selectedRequest && handleQuickAction(selectedRequest.id, 'completed')}>
                Complete
              </Button>
            )}
            {isAdmin && (selectedRequest?.status === 'reported' || selectedRequest?.status === 'assigned' || selectedRequest?.status === 'in_progress') && (
              <Button variant="danger" onClick={() => selectedRequest && handleQuickAction(selectedRequest.id, 'cancelled')}>
                Cancel
              </Button>
            )}
          </div>
        }
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted">Request ID</label>
                <p className="text-sm font-mono">#{selectedRequest.id}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Status</label>
                <div className="mt-0.5"><StatusBadge status={selectedRequest.status} /></div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Room</label>
                <p className="text-sm font-semibold">{selectedRequest.room.room_number}</p>
                <p className="text-xs text-muted">{selectedRequest.room.room_type?.name ?? ''} — Floor {selectedRequest.room.floor}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Priority</label>
                <div className="mt-0.5"><StatusBadge status={selectedRequest.priority} /></div>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted">Title</label>
                <p className="text-sm font-semibold">{selectedRequest.title}</p>
              </div>
              {selectedRequest.description && (
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted">Description</label>
                  <p className="text-sm text-gray-700">{selectedRequest.description}</p>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted">Category</label>
                <div className="mt-0.5">
                  <Badge variant={CATEGORY_BADGE[selectedRequest.category] ?? 'default'} size="sm">
                    {selectedRequest.category}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Assigned To</label>
                <p className="text-sm">{selectedRequest.assigned_to?.name ?? '—'}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border p-4">
              <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                <Image className="h-4 w-4 text-muted" />
                Images
              </h4>
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border py-8">
                <p className="text-sm text-muted">No images attached</p>
              </div>
            </div>

            <div className="rounded-lg border border-border p-4">
              <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                <Clock className="h-4 w-4 text-muted" />
                Activity Timeline
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Reported</p>
                    <p className="text-xs text-muted">{selectedRequest.created_at ? formatDateDisplay(selectedRequest.created_at) : 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 h-2 w-2 rounded-full ${selectedRequest.status === 'assigned' || selectedRequest.status === 'in_progress' || selectedRequest.status === 'completed' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Assigned</p>
                    <p className="text-xs text-muted">{selectedRequest.assigned_to ? `Assigned to ${selectedRequest.assigned_to.name}` : 'Pending assignment'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 h-2 w-2 rounded-full ${selectedRequest.status === 'in_progress' || selectedRequest.status === 'completed' ? 'bg-yellow-500' : 'bg-gray-300'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">In Progress</p>
                    <p className="text-xs text-muted">{selectedRequest.status === 'in_progress' || selectedRequest.status === 'completed' ? 'Work started' : 'Not started'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 h-2 w-2 rounded-full ${selectedRequest.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Completed</p>
                    <p className="text-xs text-muted">{selectedRequest.status === 'completed' ? 'Work finished' : 'Pending'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border p-4">
              <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                <DollarSign className="h-4 w-4 text-muted" />
                Cost Tracking
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted">Estimated Cost</label>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrencyOrNull(selectedRequest.estimated_cost)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Actual Cost</label>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrencyOrNull(selectedRequest.actual_cost)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
