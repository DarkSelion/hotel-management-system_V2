import { useState, useMemo } from 'react'
import { useContactMessages, useDeleteContactMessage } from '@/hooks/useApi'
import type { ContactMessage } from '@/types'
import { formatDateDisplay } from '@/lib/format'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { RowActions, RowActionButton } from '@/components/shared/RowActions'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Eye, Trash2, AlertCircle, Mail, User, Reply } from 'lucide-react'

function gmailReplyUrl(m: ContactMessage): string {
  const to = encodeURIComponent(m.email)
  const subject = encodeURIComponent(`Re: ${m.subject}`)
  const body = encodeURIComponent(`Hi ${m.name},\n\n--- Original message ---\n\n${m.message}`)
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`
}

export default function InquiriesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<ContactMessage | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const queryParams = useMemo(() => {
    const params: Record<string, string | number | undefined> = { page }
    if (search) params.search = search
    return params
  }, [page, search])

  const { data: messagesData, isLoading, error, refetch } = useContactMessages(queryParams)
  const deleteMessage = useDeleteContactMessage()

  const messages = messagesData?.data ?? []
  const totalPages = messagesData?.last_page ?? 1

  function openDetail(message: ContactMessage) {
    setSelected(message)
    setShowDetail(true)
  }

  function handleDelete() {
    if (!deleteConfirmId) return
    deleteMessage.mutate(deleteConfirmId, {
      onSuccess: () => {
        setDeleteConfirmId(null)
        setSelected(null)
        setShowDetail(false)
      },
    })
  }

  const columns: Column<ContactMessage>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (r) => <span className="font-medium text-gray-900">{r.name}</span>,
    },
    {
      key: 'email',
      label: 'Email',
      render: (r) => <span className="text-gray-600">{r.email}</span>,
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (r) => <span className="text-gray-900">{r.subject}</span>,
    },
    {
      key: 'message',
      label: 'Message',
      render: (r) => (
        <span className="block max-w-[280px] truncate text-gray-500">{r.message}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Received',
      render: (r) => <span className="text-gray-500">{formatDateDisplay(r.created_at)}</span>,
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
            onClick={() => openDetail(r)}
          />
          <RowActionButton
            tone="danger"
            title="Delete"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => setDeleteConfirmId(r.id)}
          />
        </RowActions>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Inquiries"
        description="Messages submitted through the portal contact form."
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Input
                placeholder="Search by name, email, subject..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={messages}
            loading={isLoading}
            error={error ? 'Failed to load inquiries' : null}
            pagination={messagesData ? {
              currentPage: page,
              lastPage: totalPages,
              total: messagesData.total,
              from: (messagesData.current_page - 1) * messagesData.per_page + 1,
              to: Math.min(messagesData.current_page * messagesData.per_page, messagesData.total),
              onPageChange: setPage,
            } : undefined}
            onRetry={() => refetch()}
            keyExtractor={(r) => r.id}
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="Message Details"
        size="lg"
      >
        {selected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted flex items-center gap-1">
                  <User className="h-3 w-3" /> From
                </label>
                <p className="mt-0.5 text-sm text-gray-900 break-words">{selected.name}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </label>
                <a href={`mailto:${selected.email}`} className="mt-0.5 block text-sm text-primary hover:underline break-all">
                  {selected.email}
                </a>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Received</label>
                <p className="mt-0.5 text-sm text-gray-900">{formatDateDisplay(selected.created_at)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Subject</label>
                <p className="mt-0.5 text-sm font-medium text-gray-900 break-words">{selected.subject}</p>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted">Message</label>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-gray-900">{selected.message}</p>
              </div>
              {selected.ip_address && (
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-muted">IP Address</label>
                  <p className="mt-0.5 text-sm text-gray-500">{selected.ip_address}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <a
                href={selected ? gmailReplyUrl(selected) : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-white hover:bg-gold-light"
              >
                <Reply className="h-4 w-4" /> Reply via Gmail
              </a>
              <Button variant="outline" onClick={() => setShowDetail(false)}>Close</Button>
              <Button
                variant="danger"
                onClick={() => setDeleteConfirmId(selected.id)}
                disabled={deleteMessage.isPending}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="mb-2 h-8 w-8 text-muted" />
            <p className="text-sm text-muted">Could not load message details.</p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteMessage.isPending}
      />
    </div>
  )
}
