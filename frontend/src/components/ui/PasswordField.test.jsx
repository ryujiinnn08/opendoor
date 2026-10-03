import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { AnnouncerContext } from './announcerContext.js'
import PasswordField from './PasswordField.jsx'

function Harness({ announce = () => {} }) {
  const [value, setValue] = useState('')
  return (
    <AnnouncerContext.Provider value={announce}>
      <PasswordField id="password" label="Password" value={value} onChange={(e) => setValue(e.target.value)} showRules />
    </AnnouncerContext.Provider>
  )
}

describe('PasswordField', () => {
  it('ticks rules off while typing and announces when all are met', async () => {
    const announce = vi.fn()
    render(<Harness announce={announce} />)
    const input = screen.getByLabelText('Password')

    await userEvent.type(input, 'abc')
    expect(screen.getByText('A lowercase letter (a-z)').parentElement).toHaveTextContent('(done)')
    expect(screen.getByText('At least 8 characters').parentElement).toHaveTextContent('(not done yet)')
    expect(announce).not.toHaveBeenCalled()

    await userEvent.type(input, 'DEF1@xy')
    expect(announce).toHaveBeenCalledWith('All password requirements met.')
  })

  it('shows and hides the password', async () => {
    render(<Harness />)
    const input = screen.getByLabelText('Password')
    const toggle = screen.getByRole('button', { name: 'Show password' })

    expect(input).toHaveAttribute('type', 'password')
    await userEvent.click(toggle)
    expect(input).toHaveAttribute('type', 'text')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Harness />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
