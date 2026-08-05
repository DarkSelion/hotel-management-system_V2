import { useState, useMemo } from 'react'
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/hooks/useApi'
import type { Expense } from '@/types'
import { formatCurrency, formatDateDisplay } from '@/lib/format'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { RowActions, RowActionButton } from '@/components/shared/RowActions'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Plus, Eye, Edit, Trash2, FileText, Save,
  AlertCircle,
} from 'lucide-react'

const CATEGORIES = [
  { value: 'utilities', label: 'Utilities', color: 'bg-blue-100 text-blue-700' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-amber-100 text-amber-700' },
  { value: 'supplies', label: 'Supplies', color: 'bg-green-100 text-green-700' },
  { value: 'salary', label: 'Salary', color: 'bg-purple-100 text-purple-700' },
  { value: 'marketing', label: 'Marketing', color: 'bg-pink-100 text-pink-700' },
  { value: 'food', label: 'Food', color: 'bg-orange-100 text-orange-700' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-600' },
]

const CATEGORY_COLORS: Record<string, string> = {
  utilities: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-amber-100 text-amber-700',
  supplies: 'bg-green-100 text-green-700',
  salary: 'bg-purple-100 text-purple-700',
  marketing: 'bg-pink-100 text-pink-700',
  food: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-600',
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return formatDateDisplay(dateStr)
}

interface ExpenseFormData {
  category: string
  amount: number | ''
  description: string
  date: string
}

const emptyForm: ExpenseFormData = {
  category: '',
  amount: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
}

export default function ExpensesPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('-date')
  const [page, setPage] = useState(1)

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [form, setForm] = useState<ExpenseFormData>(emptyForm)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ExpenseFormData, string>>>({})
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const queryParams = useMemo(() => {
    const params: Record<string, string | number | undefined> = { page, sort: sortBy }
    if (search) params.search = search
    if (categoryFilter) params.category = categoryFilter
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    return params
  }, [page, sortBy, search, categoryFilter, dateFrom, dateTo])

  const { data: expensesData, isLoading, error, refetch } = useExpenses(queryParams)
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

  const expenses = expensesData?.data ?? []
  const totalPages = expensesData?.last_page ?? 1

  function openDetailModal(expense: Expense) {
    setSelectedExpense(expense)
    setShowDetailModal(true)
  }

  function openNewForm() {
    setEditingExpense(null)
    setForm(emptyForm)
    setFormErrors({})
    setShowFormModal(true)
  }

  function openEditForm(expense: Expense) {
    setEditingExpense(expense)
    setForm({
      category: expense.category,
      amount: expense.amount,
      description: expense.description ?? '',
      date: expense.date?.split('T')[0] ?? '',
    })
    setFormErrors({})
    setShowFormModal(true)
  }

  function closeFormModal() {
    setShowFormModal(false)
    setEditingExpense(null)
    setForm(emptyForm)
    setFormErrors({})
  }

  function validateForm(): boolean {
    const errors: Partial<Record<keyof ExpenseFormData, string>> = {}
    if (!form.category) errors.category = 'Category is required'
    if (form.amount === '' || Number(form.amount) <= 0) errors.amount = 'Amount must be greater than 0'
    if (!form.date) errors.date = 'Date is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleFormSubmit() {
    if (!validateForm()) return

    const payload = {
      category: form.category,
      amount: Number(form.amount),
      description: form.description || undefined,
      date: form.date,
    }

    if (editingExpense) {
      updateExpense.mutate({ id: editingExpense.id, data: payload }, { onSuccess: closeFormModal })
    } else {
      createExpense.mutate(payload, { onSuccess: closeFormModal })
    }
  }

  function handleDelete() {
    if (!deleteConfirmId) return
    deleteExpense.mutate(deleteConfirmId, { onSuccess: () => setDeleteConfirmId(null) })
  }

  function updateField<K extends keyof ExpenseFormData>(key: K, value: ExpenseFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (formErrors[key]) {
      setFormErrors(prev => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })
    }
  }

  function handleSort(key: string) {
    setSortBy(prev => prev === key ? `-${key}` : prev === `-${key}` ? key : key)
  }

  const isFormSubmitting = createExpense.isPending || updateExpense.isPending

  const columns: Column<Expense>[] = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (r) => <span>{formatDate(r.date)}</span>,
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (r) => {
        const cat = CATEGORIES.find(c => c.value === r.category)
        return (
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[r.category] ?? 'bg-gray-100 text-gray-600'}`}>
            {cat?.label ?? r.category}
          </span>
        )
      },
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (r) => <span className="text-gray-900">{r.description || '-'}</span>,
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (r) => <span className="font-medium">{formatCurrency(r.amount)}</span>,
    },
    {
      key: 'receipt',
      label: 'Receipt',
      render: () => (
        <Button variant="ghost" size="sm" className="text-primary">
          <FileText className="h-4 w-4" />
        </Button>
      ),
    },
    {
      key: 'created_by',
      label: 'Created By',
      sortable: true,
      render: (r) => <span>{r.created_by?.name ?? '-'}</span>,
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
          <RowActionButton
            tone="neutral"
            title="Edit"
            icon={<Edit className="h-4 w-4" />}
            onClick={() => openEditForm(r)}
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
        title="Expenses"
        description="Track hotel expenses and operational costs."
        actions={
          <Button variant="gold" onClick={openNewForm}>
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Input
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <div className="w-44">
              <Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </div>
            <div className="w-44">
              <DatePicker value={dateFrom} onChange={(v) => { setDateFrom(v); setPage(1) }} placeholder="From date" clearable />
            </div>
            <div className="w-44">
              <DatePicker value={dateTo} onChange={(v) => { setDateTo(v); setPage(1) }} placeholder="To date" clearable />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={expenses}
            loading={isLoading}
            error={error ? 'Failed to load expenses' : null}
            sortBy={sortBy}
            onSort={handleSort}
            pagination={expensesData ? {
              currentPage: page,
              lastPage: totalPages,
              total: expensesData.total,
              from: (expensesData.current_page - 1) * expensesData.per_page + 1,
              to: Math.min(expensesData.current_page * expensesData.per_page, expensesData.total),
              onPageChange: setPage,
            } : undefined}
            onRetry={() => refetch()}
            keyExtractor={(r) => r.id}
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Expense Details"
        size="lg"
      >
        {selectedExpense ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted">Category</label>
                <p className="mt-0.5">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[selectedExpense.category] ?? 'bg-gray-100 text-gray-600'}`}>
                    {CATEGORIES.find(c => c.value === selectedExpense.category)?.label ?? selectedExpense.category}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Amount</label>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedExpense.amount)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Date</label>
                <p className="text-sm text-gray-900">{formatDate(selectedExpense.date)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Created By</label>
                <p className="text-sm text-gray-900">{selectedExpense.created_by?.name ?? '-'}</p>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted">Description</label>
                <p className="text-sm text-gray-900">{selectedExpense.description || '-'}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>Close</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="mb-2 h-8 w-8 text-muted" />
            <p className="text-sm text-muted">Could not load expense details.</p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showFormModal}
        onClose={closeFormModal}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={closeFormModal} disabled={isFormSubmitting}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleFormSubmit} disabled={isFormSubmitting}>
              {isFormSubmitting ? 'Saving...' : <><Save className="h-4 w-4" /> Save</>}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Category"
            placeholder="Select category"
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
            error={formErrors.category}
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>

          <Input
            label="Amount (₱)"
            type="number"
            min={0}
            step="0.01"
            placeholder="0.00"
            value={form.amount === '' ? '' : form.amount}
            onChange={(e) => updateField('amount', e.target.value ? Number(e.target.value) : '')}
            error={formErrors.amount}
          />

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm ring-offset-card placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
              placeholder="Expense description..."
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
            />
          </div>

          <DatePicker
            label="Date"
            value={form.date}
            onChange={(v) => updateField('date', v)}
          />

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Receipt</label>
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted hover:bg-gray-50">
                <FileText className="h-4 w-4" />
                Upload Receipt
                <input type="file" className="hidden" accept="image/*,.pdf" />
              </label>
              <span className="text-xs text-muted">PNG, JPG or PDF</span>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteExpense.isPending}
      />
    </div>
  )
}
