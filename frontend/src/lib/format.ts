export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

export function formatDateDisplay(dateStr: string, style: 'compact' | 'long' = 'compact'): string {
  if (!dateStr) return '-'
  const datePart = dateStr.split(/[\sT]/)[0]
  const date = new Date(datePart + 'T00:00:00')
  if (isNaN(date.getTime())) return '-'

  if (style === 'long') {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
