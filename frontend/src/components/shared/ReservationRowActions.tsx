import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/components/ui/dropdown-menu'
import { Eye, Pencil, XCircle, LogIn, LogOut, MoreVertical, UserX } from 'lucide-react'
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
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          square
          className="px-0"
          onClick={(e) => { e.stopPropagation(); onView() }}
          title="View"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const overdue = status === 'confirmed' && !!is_overdue

  const primary =
    overdue
      ? { label: 'Mark No Show', icon: <UserX className="h-3.5 w-3.5" />, classes: 'bg-warning text-white hover:bg-amber-500', onClick: onMarkNoShow }
      : status === 'confirmed'
        ? { label: 'Check In', icon: <LogIn className="h-3.5 w-3.5" />, classes: 'bg-success text-white hover:bg-emerald-600', onClick: onCheckIn }
        : status === 'checked_in'
          ? { label: 'Check Out', icon: <LogOut className="h-3.5 w-3.5" />, classes: 'bg-primary text-white hover:bg-primary-light', onClick: onCheckOut }
          : null

  const kebabItems = [
    { label: 'View', icon: <Eye className="h-4 w-4" />, onClick: onView },
    { label: 'Edit', icon: <Pencil className="h-4 w-4" />, onClick: onEdit },
    ...(overdue ? [{ label: 'Check In (late)', icon: <LogIn className="h-4 w-4" />, onClick: onCheckIn }] : []),
    ...(status === 'pending' || status === 'confirmed'
      ? [{ label: 'Cancel', icon: <XCircle className="h-4 w-4" />, danger: true as const, onClick: onCancel }]
      : []),
  ]

  return (
    <div className="flex items-center gap-2">
      {primary && (
        <Button size="sm" className={primary.classes} onClick={(e) => { e.stopPropagation(); primary.onClick() }}>
          {primary.icon}
          {primary.label}
        </Button>
      )}
      <DropdownMenu
        align="right"
        trigger={
          <Button
            variant="ghost"
            size="sm"
            square
            className="px-0"
            title="More actions"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        }
        items={kebabItems}
      />
    </div>
  )
}
