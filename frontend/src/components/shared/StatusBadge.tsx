import { Badge } from '../ui/badge'

const statusConfig: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'gold'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  confirmed: { variant: 'info', label: 'Confirmed' },
  checked_in: { variant: 'success', label: 'Checked In' },
  checked_out: { variant: 'default', label: 'Checked Out' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
  no_show: { variant: 'danger', label: 'No Show' },
  unpaid: { variant: 'warning', label: 'Unpaid' },
  partial: { variant: 'gold', label: 'Partial' },
  paid: { variant: 'success', label: 'Paid' },
  refunded: { variant: 'info', label: 'Refunded' },
  available: { variant: 'success', label: 'Available' },
  occupied: { variant: 'danger', label: 'Occupied' },
  maintenance: { variant: 'warning', label: 'Maintenance' },
  reserved: { variant: 'info', label: 'Reserved' },
  cleaning: { variant: 'default', label: 'Cleaning' },
  clean: { variant: 'success', label: 'Clean' },
  dirty: { variant: 'warning', label: 'Dirty' },
  in_progress: { variant: 'info', label: 'In Progress' },
  inspected: { variant: 'gold', label: 'Inspected' },
  draft: { variant: 'default', label: 'Draft' },
  sent: { variant: 'info', label: 'Sent' },
  overdue: { variant: 'danger', label: 'Overdue' },
  failed: { variant: 'danger', label: 'Failed' },
  completed: { variant: 'success', label: 'Completed' },
  assigned: { variant: 'info', label: 'Assigned' },
  reported: { variant: 'warning', label: 'Reported' },
  low: { variant: 'default', label: 'Low' },
  medium: { variant: 'info', label: 'Medium' },
  normal: { variant: 'info', label: 'Normal' },
  high: { variant: 'warning', label: 'High' },
  urgent: { variant: 'danger', label: 'Urgent' },
  critical: { variant: 'danger', label: 'Critical' },
  active: { variant: 'success', label: 'Active' },
  inactive: { variant: 'default', label: 'Inactive' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { variant: 'default' as const, label: status }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
