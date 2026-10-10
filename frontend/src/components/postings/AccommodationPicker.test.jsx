import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import AccommodationPicker from './AccommodationPicker.jsx'

const GROUPS = [
  {
    group: 'Work arrangement',
    accommodations: [
      { id: 1, name: 'Remote work', description: 'The job can be done fully from home.', is_active: true },
      { id: 2, name: 'Flexible hours', description: 'Start and end times can be adjusted.', is_active: true },
    ],
  },
]

const RETIRED_GROUPS = [
  {
    group: 'Physical access',
    accommodations: [{ id: 3, name: 'Accessible parking', description: 'Reserved parking near the entrance.', is_active: false }],
  },
]

function Harness({ initial = [], retired = false }) {
  const [value, setValue] = useState(initial)

  return (
    <AccommodationPicker
      id="accommodations"
      legend="Accommodations you provide"
      groups={retired ? RETIRED_GROUPS : GROUPS}
      value={value}
      onChange={setValue}
    />
  )
}

describe('AccommodationPicker', () => {
  it('shows a note field only for ticked accommodations', async () => {
    render(<Harness />)
    expect(screen.queryByLabelText(/Note about Remote work/)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('checkbox', { name: 'Remote work' }))
    expect(screen.getByLabelText(/Note about Remote work/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('checkbox', { name: 'Remote work' }))
    expect(screen.queryByLabelText(/Note about Remote work/)).not.toBeInTheDocument()
  })

  it('keeps what is typed in a note', async () => {
    render(<Harness initial={[{ id: 2, note: '' }]} />)

    await userEvent.type(screen.getByLabelText(/Note about Flexible hours/), 'Start between 7 and 10 a.m.')

    expect(screen.getByLabelText(/Note about Flexible hours/)).toHaveValue('Start between 7 and 10 a.m.')
  })

  it('marks retired accommodations as no longer offered', () => {
    render(<Harness initial={[{ id: 3, note: '' }]} retired />)

    expect(screen.getByRole('checkbox', { name: 'Accessible parking (no longer offered)' })).toBeChecked()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Harness initial={[{ id: 1, note: 'Laptop provided' }]} />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
