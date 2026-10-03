import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import FormField from './FormField.jsx'

describe('FormField', () => {
  it('labels the input and links hint and error to it', () => {
    render(<FormField id="email" label="Email address" hint="You will use this to log in." error="Enter your email address." />)

    const input = screen.getByLabelText('Email address')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('You will use this to log in. Error: Enter your email address.')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<FormField id="name" label="Full name" error="Enter your full name." />)

    expect(await axe(container)).toHaveNoViolations()
  })

  it('marks optional fields in the label', () => {
    render(<FormField id="description" label="Description" optional />)

    expect(screen.getByLabelText('Description (optional)')).toBeInTheDocument()
  })
})
