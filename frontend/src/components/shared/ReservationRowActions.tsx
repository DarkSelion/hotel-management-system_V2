import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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

const ACTION_BOX = 'inline-flex h-8 items-stretch overflow-hidden rounded-lg border border-border divide-x divide-border'

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
      <div className={ACTION_BOX}>
        <Button
          variant="ghost"
          size="sm"
          square
          className="rounded-none border-0 bg-gray-100 text-gray-600 hover:bg-gray-200"
          onClick={(e) => { e.stopPropagation(); onView() }}
          title="View"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const overdue = status === 'confirmed' && !!is_overdue

  const iconBtn = (title: string, onClick: () => void, className: string, icon: ReactNode, key: string) => (
    <Button
      key={key}
      variant="ghost"
      size="sm"
      square
      className={cn('rounded-none border-0', className)}
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick() }}
    >
      {icon}
    </Button>
  )

  const buttons: ReactNode[] = [
    iconBtn('View', onView, 'bg-gray-100 text-gray-600 hover:bg-gray-200', <Eye className="h-4 w-4" />, 'view'),
    iconBtn('Edit', onEdit, 'bg-gray-100 text-gray-600 hover:bg-gray-200', <Pencil className="h-4 w-4" />, 'edit'),
  ]

  if (status === 'pending' || status === 'confirmed') {
    buttons.push(iconBtn('Cancel', onCancel, 'bg-red-100 text-red-700 hover:bg-red-200', <XCircle className="h-4 w-4" />, 'cancel'))
  }
  if (status === 'confirmed' && !overdue) {
    buttons.push(iconBtn('Check In', onCheckIn, 'bg-green-100 text-green-700 hover:bg-green-200', <LogIn className="h-4 w-4" />, 'checkin'))
  }
  if (overdue) {
    buttons.push(iconBtn('Mark No Show', onMarkNoShow, 'bg-amber-100 text-amber-700 hover:bg-amber-200', <UserX className="h-4 w-4" />, 'noshow'))
  }
  if (status === 'checked_in') {
    buttons.push(iconBtn('Check Out', onCheckOut, 'bg-blue-100 text-blue-700 hover:bg-blue-200', <LogOut className="h-4 w-4" />, 'checkout'))
  }

  return <div className={ACTION_BOX}>{buttons}</div>
}
