import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import ConfirmDialog from './ConfirmDialog.jsx'

function Harness({ onConfirm = () => {} }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Delete Healthcare</button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title='Delete "Healthcare"?'
        description="This cannot be undone."
        confirmLabel="Delete category"
        onConfirm={onConfirm}
      />
    </>
  )
}

describe('ConfirmDialog', () => {
  it('starts on Cancel so Enter never confirms by accident', async () => {
    const onConfirm = vi.fn()
    render(<Harness onConfirm={onConfirm} />)

    await userEvent.click(screen.getByRole('button', { name: 'Delete Healthcare' }))

    expect(screen.getByRole('dialog', { name: 'Delete "Healthcare"?' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus())

    await userEvent.keyboard('{Enter}')
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('returns focus to the button that opened it when closed with Escape', async () => {
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Delete Healthcare' })

    await userEvent.click(opener)
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(opener).toHaveFocus())
  })
})
