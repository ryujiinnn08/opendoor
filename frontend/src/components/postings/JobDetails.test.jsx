import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { postingFixture as posting } from '../../test/postingFixture.js'
import JobDetails from './JobDetails.jsx'

describe('JobDetails', () => {
  it('puts accommodations with their notes first', () => {
    render(<JobDetails posting={posting} />)

    const panel = screen.getByRole('region', { name: 'Accommodations provided' })
    expect(within(panel).getByText('Remote work')).toBeInTheDocument()
    expect(within(panel).getByText('Laptop and internet allowance provided.')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })[0]).toHaveTextContent('Accommodations provided')
  })

  it('shows the details at a glance', () => {
    render(<JobDetails posting={posting} />)

    const glance = screen.getByRole('region', { name: 'At a glance' })
    expect(within(glance).getByText('Remote')).toBeInTheDocument()
    expect(within(glance).getByText('Full-time')).toBeInTheDocument()
    expect(within(glance).getByText('November 30, 2026')).toBeInTheDocument()
  })

  it('says when the employer is an individual', () => {
    render(<JobDetails posting={{ ...posting, employer: { ...posting.employer, type: 'individual' }, department: null }} />)

    expect(screen.getByText('Individual employer')).toBeInTheDocument()
  })

  it('marks missing details on drafts', () => {
    render(<JobDetails posting={{ ...posting, location: null }} />)

    expect(screen.getByText('Not added yet')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<JobDetails posting={posting} />)

    expect(await axe(container)).toHaveNoViolations()
  })

  it('marks retired accommodations only when asked to', () => {
    const withRetired = {
      ...posting,
      accommodations: [{ id: 3, name: 'Accessible parking', group_name: 'Physical access', note: null, is_active: false }],
    }

    const { unmount } = render(<JobDetails posting={withRetired} markRetired />)
    expect(screen.getByText('Accessible parking (no longer offered)')).toBeInTheDocument()
    unmount()

    render(<JobDetails posting={withRetired} />)
    expect(screen.getByText('Accessible parking')).toBeInTheDocument()
  })
})
