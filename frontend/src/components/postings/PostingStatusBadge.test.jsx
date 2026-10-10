import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PostingStatusBadge from './PostingStatusBadge.jsx'

describe('PostingStatusBadge', () => {
  it.each([
    ['draft', 'Draft'],
    ['pending', 'Waiting for approval'],
    ['open', 'Open'],
    ['rejected', 'Rejected'],
    ['closed', 'Closed'],
  ])('shows %s as text', (status, label) => {
    render(<PostingStatusBadge status={status} />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
