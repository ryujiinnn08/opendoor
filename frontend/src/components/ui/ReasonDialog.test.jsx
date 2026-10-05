import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ReasonDialog from './ReasonDialog.jsx'

describe('ReasonDialog', () => {
  it('needs a reason before confirming', async () => {
    const onConfirm = vi.fn()
    render(<ReasonDialog open onOpenChange={() => {}} title='Reject "Acme"?' confirmLabel="Reject" onConfirm={onConfirm} />)

    await userEvent.click(screen.getByRole('button', { name: 'Reject' }))

    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Reason')).toHaveAccessibleDescription('Error: Enter a reason.')
    expect(screen.getByLabelText('Reason')).toHaveFocus()

    await userEvent.type(screen.getByLabelText('Reason'), '  Number does not match.  ')
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }))

    expect(onConfirm).toHaveBeenCalledWith('Number does not match.')
  })
})
