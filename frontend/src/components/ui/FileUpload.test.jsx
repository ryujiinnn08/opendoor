import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import FileUpload from './FileUpload.jsx'

function renderUpload(onUpload = vi.fn().mockResolvedValue()) {
  render(<FileUpload id="logo" label="Company logo" previewAlt="Current image for Acme" onUpload={onUpload} onRemove={vi.fn()} />)
  return onUpload
}

describe('FileUpload', () => {
  it('refuses files that are too large before uploading', async () => {
    const onUpload = renderUpload()
    const big = new File([new Uint8Array(3 * 1024 * 1024)], 'logo.png', { type: 'image/png' })

    await userEvent.upload(screen.getByLabelText('Company logo'), big)
    await userEvent.click(screen.getByRole('button', { name: 'Upload image' }))

    expect(onUpload).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Company logo')).toHaveAccessibleDescription(
      'PNG, JPG or WebP, smaller than 2 MB. A square image looks best. Error: The logo must be smaller than 2 MB.',
    )
  })

  it('uploads an accepted image', async () => {
    const onUpload = renderUpload()
    const logo = new File(['png'], 'logo.png', { type: 'image/png' })

    await userEvent.upload(screen.getByLabelText('Company logo'), logo)
    await userEvent.click(screen.getByRole('button', { name: 'Upload image' }))

    expect(onUpload).toHaveBeenCalledWith(logo)
  })
})
