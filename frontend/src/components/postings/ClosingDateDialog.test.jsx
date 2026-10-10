import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ClosingDateDialog from './ClosingDateDialog.jsx'

describe('ClosingDateDialog', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-05T02:00:00Z'))
  })

  afterEach(() => vi.useRealTimers())

  it('needs a date in the allowed range', async () => {
    const onConfirm = vi.fn()
    render(<ClosingDateDialog open onOpenChange={() => {}} title="Reopen" confirmLabel="Reopen posting" onConfirm={onConfirm} />)

    await userEvent.click(screen.getByRole('button', { name: 'Reopen posting' }))
    expect(screen.getByLabelText('New closing date')).toHaveAccessibleDescription(/Choose a new closing date\./)
    expect(onConfirm).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('New closing date'), { target: { value: '2027-06-01' } })
    await userEvent.click(screen.getByRole('button', { name: 'Reopen posting' }))
    expect(screen.getByLabelText('New closing date')).toHaveAccessibleDescription(
      /Choose a closing date between October 6, 2026 and April 5, 2027\./,
    )
    expect(onConfirm).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('New closing date'), { target: { value: '2026-11-30' } })
    await userEvent.click(screen.getByRole('button', { name: 'Reopen posting' }))
    expect(onConfirm).toHaveBeenCalledWith('2026-11-30')
  })

  it('refuses a date with a five-digit year', async () => {
    const onConfirm = vi.fn()
    render(<ClosingDateDialog open onOpenChange={() => {}} title="Reopen" confirmLabel="Reopen posting" onConfirm={onConfirm} />)

    fireEvent.change(screen.getByLabelText('New closing date'), { target: { value: '20261-01-01' } })
    await userEvent.click(screen.getByRole('button', { name: 'Reopen posting' }))

    expect(screen.getByLabelText('New closing date')).toHaveAccessibleDescription(
      /Choose a closing date between October 6, 2026 and April 5, 2027\./,
    )
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
