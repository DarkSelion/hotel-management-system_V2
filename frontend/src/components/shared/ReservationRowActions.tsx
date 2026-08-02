import type { ReactNode } from 'react'
import { RowActions, RowActionButton } from '@/components/shared/RowActions'
import { Eye, Pencil, XCircle, LogIn, LogOut, UserX } from 'lucide-react'
import type { Reservation } from '@/types'

interface ReservationRowActionsProps {
  reservation: Reservation
  onView: () => void
  onEdit: () => void
  onCancel?: () => void
  onCheckIn?: () => void
  onCheckOut?: () => void
  onMarkNoShow?: () => void
  alwaysAllowCheckIn?: boolean
}

export function ReservationRowActions({
  reservation,
  onView,
  onEdit,
  onCancel,
  onCheckIn,
  onCheckOut,
  onMarkNoShow,
  alwaysAllowCheckIn,
}: ReservationRowActionsProps) {
  const { status, is_overdue } = reservation

  if (status === 'cancelled' || status === 'no_show' || status === 'checked_out') {
    return (
      <RowActions>
        <RowActionButton tone="neutral" title="View" icon={<Eye className="h-4 w-4" />} onClick={onView} />
      </RowActions>
    )
  }

  const overdue = status === 'confirmed' && !!is_overdue && !alwaysAllowCheckIn

  const buttons: ReactNode[] = [
    <RowActionButton key="view" tone="neutral" title="View" icon={<Eye className="h-4 w-4" />} onClick={onView} />,
    <RowActionButton key="edit" tone="neutral" title="Edit" icon={<Pencil className="h-4 w-4" />} onClick={onEdit} />,
  ]

  if ((status === 'pending' || status === 'confirmed') && onCancel) {
    buttons.push(<RowActionButton key="cancel" tone="danger" title="Cancel" icon={<XCircle className="h-4 w-4" />} onClick={onCancel} />)
  }
  if (status === 'confirmed' && !overdue && onCheckIn) {
    buttons.push(<RowActionButton key="checkin" tone="success" title="Check In" icon={<LogIn className="h-4 w-4" />} onClick={onCheckIn} />)
  }
  if (overdue && onMarkNoShow) {
    buttons.push(<RowActionButton key="noshow" tone="warning" title="Mark No Show" icon={<UserX className="h-4 w-4" />} onClick={onMarkNoShow} />)
  }
  if (status === 'checked_in' && onCheckOut) {
    buttons.push(<RowActionButton key="checkout" tone="info" title="Check Out" icon={<LogOut className="h-4 w-4" />} onClick={onCheckOut} />)
  }

  return <RowActions>{buttons}</RowActions>
}
