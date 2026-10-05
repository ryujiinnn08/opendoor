import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { AnnouncerContext } from './announcerContext.js'
import CopyLinkBox from './CopyLinkBox.jsx'

function renderBox(announce = vi.fn()) {
  return render(
    <AnnouncerContext.Provider value={announce}>
      <CopyLinkBox id="invite" label="Invite link for IT" hint="It works once." value="http://localhost:5173/join/abc" />
    </AnnouncerContext.Provider>,
  )
}

describe('CopyLinkBox', () => {
  afterEach(() => vi.restoreAllMocks())

  it('copies the link and announces it', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    const announce = vi.fn()
    renderBox(announce)

    await user.click(screen.getByRole('button', { name: 'Copy link' }))

    expect(writeText).toHaveBeenCalledWith('http://localhost:5173/join/abc')
    expect(announce).toHaveBeenCalledWith('Link copied.')
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('selects the link when the browser blocks copying', async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('blocked'))
    const announce = vi.fn()
    renderBox(announce)

    await user.click(screen.getByRole('button', { name: 'Copy link' }))

    expect(announce).toHaveBeenCalledWith(expect.stringContaining('The link is selected'))
  })

  it('labels the link field and has no accessibility violations', async () => {
    const { container } = renderBox()

    expect(screen.getByLabelText('Invite link for IT')).toHaveValue('http://localhost:5173/join/abc')
    expect(await axe(container)).toHaveNoViolations()
  })
})
