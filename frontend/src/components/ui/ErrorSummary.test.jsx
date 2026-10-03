import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { summaryFrom } from '../../lib/errorSummary.js'
import ErrorSummary from './ErrorSummary.jsx'
import FormField from './FormField.jsx'

function Form({ errors }) {
  return (
    <>
      <ErrorSummary errors={errors} focusKey={1} />
      <FormField id="email" label="Email address" error="Enter your email address." />
    </>
  )
}

describe('ErrorSummary', () => {
  const errors = summaryFrom({ email: 'Enter your email address.' }, ['email'], 'This account has been suspended.')

  it('takes focus and lists general and field errors', () => {
    render(<Form errors={errors} />)

    const summary = screen.getByRole('heading', { name: 'There is a problem' }).parentElement
    expect(summary).toHaveFocus()
    expect(screen.getByText('This account has been suspended.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Enter your email address.' })).toHaveAttribute('href', '#email')
  })

  it('moves focus to the field when an error link is followed', async () => {
    render(<Form errors={errors} />)

    await userEvent.click(screen.getByRole('link', { name: 'Enter your email address.' }))

    expect(screen.getByLabelText('Email address')).toHaveFocus()
  })

  it('renders nothing without errors', () => {
    const { container } = render(<ErrorSummary errors={[]} focusKey={0} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Form errors={errors} />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
