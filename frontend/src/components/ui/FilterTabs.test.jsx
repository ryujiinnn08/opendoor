import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoutes } from '../../test/renderWithProviders.jsx'
import FilterTabs from './FilterTabs.jsx'

describe('FilterTabs', () => {
  it('marks the active filter for screen readers', () => {
    const items = [
      { value: 'pending', label: 'Waiting' },
      { value: 'verified', label: 'Verified' },
    ]
    renderRoutes([{ path: '/', element: <FilterTabs label="Verification status" items={items} current="verified" /> }])

    expect(screen.getByRole('navigation', { name: 'Verification status' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Verified' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('link', { name: 'Waiting' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'Waiting' })).toHaveAttribute('href', '/?status=pending')
  })
})
