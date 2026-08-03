import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DatePicker } from './date-picker'

function renderPicker(value = '', onChange = vi.fn()) {
  return { onChange, ...render(<DatePicker value={value} onChange={onChange} clearable />) }
}

describe('DatePicker clearable', () => {
  it('hides the clear button when no date is selected', () => {
    renderPicker('')
    expect(screen.queryByRole('button', { name: 'Clear date' })).not.toBeInTheDocument()
  })

  it('shows the clear button when a date is selected', () => {
    renderPicker('2026-10-10')
    expect(screen.getByRole('button', { name: 'Clear date' })).toBeInTheDocument()
  })

  it('clears the date without opening the popup', () => {
    const { onChange } = renderPicker('2026-10-10')

    fireEvent.click(screen.getByRole('button', { name: 'Clear date' }))

    expect(onChange).toHaveBeenCalledWith('')
    expect(screen.queryByText('Su')).not.toBeInTheDocument()
  })

  it('returns to the placeholder after the value is cleared', () => {
    const onChange = vi.fn()
    const result = renderPicker('2026-10-10', onChange)

    fireEvent.click(screen.getByRole('button', { name: 'Clear date' }))
    expect(onChange).toHaveBeenCalledWith('')

    result.rerender(<DatePicker value="" onChange={onChange} clearable />)
    expect(screen.getByText('Select date')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear date' })).not.toBeInTheDocument()
  })

  it('does not render the clear button when clearable is not set', () => {
    render(<DatePicker value="2026-10-10" onChange={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Clear date' })).not.toBeInTheDocument()
  })
})
