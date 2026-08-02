import { Button } from '@/components/ui/button'
import { Eye, Pencil, XCircle, LogIn, LogOut, UserX } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Reservation } from '@/types'

interface ReservationRowActionsProps {
  reservation: Reservation
  onView: () => void
  onEdit: () => void
  onCancel: () => void
  onCheckIn: () => void
  onCheckOut: () => void
  onMarkNoShow: () => void
}

export function ReservationRowActions({
  reservation,
  onView,
  onEdit,
  onCancel,
  onCheckIn,
  onCheckOut,
  onMarkNoShow,
}: ReservationRowActionsProps) {
  const { status, is_overdue } = reservation

  if (status === 'cancelled' || status === 'no_show' || status === 'checked_out') {
    return (
      <Button
        variant="ghost"
        size="sm"
        square
        onClick={(e) => { e.stopPropagation(); onView() }}
        title="View"
      >
        <Eye className="h-4 w-4" />
      </Button>
    )
  }

  const overdue = status === 'confirmed' && !!is_overdue

  const iconBtn = (title: string, onClick: () => void, className: string, icon: ReactNode, key: string) => (
    <Button
      key={key}
      variant="ghost"
      size="sm"
      square
      className={className}
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick() }}
    >
      {icon}
    </Button>
  )

  const buttons: ReactNode[] = [
    iconBtn('View', onView, '', <Eye className="h-4 w-4" />, 'view'),
    iconBtn('Edit', onEdit, '', <Pencil className="h-4 w-4" />, 'edit'),
  ]

  if (status === 'pending' || status === 'confirmed') {
    buttons.push(iconBtn('Cancel', onCancel, 'text-danger hover:text-danger', <XCircle className="h-4 w-4" />, 'cancel'))
  }
  if (status === 'confirmed' && !overdue) {
    buttons.push(iconBtn('Check In', onCheckIn, 'text-success hover:text-success', <LogIn className="h-4 w-4" />, 'checkin'))
  }
  if (overdue) {
    buttons.push(iconBtn('Mark No Show', onMarkNoShow, 'text-warning hover:text-warning', <UserX className="h-4 w-4" />, 'noshow'))
  }
  if (status === 'checked_in') {
    buttons.push(iconBtn('Check Out', onCheckOut, 'text-muted hover:text-muted', <LogOut className="h-4 w-4" />, 'checkout'))
  }

  return <div className="flex items-center gap-1">{buttons}</div>
}
