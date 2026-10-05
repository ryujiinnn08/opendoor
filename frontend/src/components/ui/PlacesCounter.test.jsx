import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PlacesCounter from './PlacesCounter.jsx'

describe('PlacesCounter', () => {
  it('shows places used as text', () => {
    render(<PlacesCounter used={2} limit={3} effectiveLimit={3} />)

    expect(screen.getByText('2 of 3 places used')).toBeInTheDocument()
    expect(screen.queryByText('Full')).not.toBeInTheDocument()
  })

  it('says when a department is full, and when the platform cap is lower than its limit', () => {
    render(<PlacesCounter used={2} limit={5} effectiveLimit={2} />)

    expect(screen.getByText('Full')).toBeInTheDocument()
    expect(screen.getByText(/limit is 5, but OpenDoor currently allows at most 2/)).toBeInTheDocument()
  })
})
