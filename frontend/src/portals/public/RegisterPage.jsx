import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { fieldErrorsFrom, generalErrorFrom } from '../../api/client.js'
import { useAuth } from '../../auth/authContext.js'
import { dashboardFor } from '../../auth/redirects.js'
import { useAnnounce } from '../../components/ui/announcerContext.js'
import Button from '../../components/ui/Button.jsx'
import CheckboxField from '../../components/ui/CheckboxField.jsx'
import ErrorSummary from '../../components/ui/ErrorSummary.jsx'
import { summaryFrom } from '../../lib/errorSummary.js'
import FormField from '../../components/ui/FormField.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'
import PasswordField from '../../components/ui/PasswordField.jsx'
import RadioCardGroup from '../../components/ui/RadioCardGroup.jsx'
import { checkPassword } from '../../lib/passwordRules.js'

const ROLES = [
  {
    value: 'candidate',
    title: "I'm looking for a job",
    text: 'Find jobs that provide the accommodations you need.',
  },
  {
    value: 'employer',
    title: "I'm hiring",
    text: 'Post jobs and show the accommodations your workplace provides.',
  },
]

const FIELDS = ['role', 'name', 'email', 'password', 'password_confirmation', 'consent']

// The summary links to the first radio button for the role question.
const FIELD_IDS = { role: 'role-candidate' }

const PASSWORD_MESSAGES = {
  length: 'Use at least 8 characters.',
  upper: 'Add an uppercase letter (A-Z) and a lowercase letter (a-z).',
  lower: 'Add an uppercase letter (A-Z) and a lowercase letter (a-z).',
  number: 'Add a number (0-9).',
  symbol: 'Add a special character, such as ! or @.',
}

function validate(values) {
  const errors = {}
  if (!values.role) errors.role = 'Choose whether you are looking for a job or hiring.'
  if (!values.name.trim()) errors.name = 'Enter your full name.'
  if (!values.email.trim()) errors.email = 'Enter your email address.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = 'Enter an email address in the correct format, like name@example.com.'

  const unmet = checkPassword(values.password).find((rule) => !rule.met)
  if (!values.password) errors.password = 'Enter a password.'
  else if (unmet) errors.password = PASSWORD_MESSAGES[unmet.id]

  if (!values.password_confirmation) errors.password_confirmation = 'Enter your password again.'
  else if (values.password_confirmation !== values.password)
    errors.password_confirmation = 'The two passwords do not match.'

  if (!values.consent) errors.consent = 'You need to agree to the privacy notice to create an account.'
  return errors
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const announce = useAnnounce()
  const [searchParams] = useSearchParams()
  const preselected = ROLES.some((role) => role.value === searchParams.get('type')) ? searchParams.get('type') : ''

  const [values, setValues] = useState({
    role: preselected,
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    consent: false,
  })
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState(null)
  const [focusKey, setFocusKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  function update(field) {
    return (event) => {
      const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
      setValues((current) => ({ ...current, [field]: value }))
    }
  }

  function showErrors(fieldErrors, general = null) {
    setErrors(fieldErrors)
    setGeneralError(general)
    setFocusKey((key) => key + 1)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return

    const clientErrors = validate(values)
    if (Object.keys(clientErrors).length) return showErrors(clientErrors)

    setSubmitting(true)
    try {
      const user = await register({ ...values, name: values.name.trim(), email: values.email.trim().toLowerCase() })
      announce(`Account created. Welcome to OpenDoor, ${user.name}.`)
      navigate(dashboardFor(user.role), { replace: true })
    } catch (error) {
      showErrors(fieldErrorsFrom(error), generalErrorFrom(error))
      setSubmitting(false)
    }
  }

  const summary = summaryFrom(errors, FIELDS, generalError).map((item) =>
    item.id && FIELD_IDS[item.id] ? { ...item, id: FIELD_IDS[item.id] } : item,
  )

  return (
    <div className="max-w-2xl">
      <PageHeading>Create an account</PageHeading>
      <p className="mt-4">It takes about two minutes. All fields are required.</p>

      <div className="mt-8">
        <ErrorSummary errors={summary} focusKey={focusKey} />

        <form onSubmit={handleSubmit} noValidate>
          <RadioCardGroup
            name="role"
            legend="What brings you to OpenDoor?"
            options={ROLES}
            value={values.role}
            onChange={update('role')}
            error={errors.role}
          />

          <FormField
            id="name"
            label="Full name"
            hint={values.role === 'employer' ? 'Your own name. You can add your company details after creating your account.' : null}
            autoComplete="name"
            value={values.name}
            onChange={update('name')}
            error={errors.name}
          />
          <FormField
            id="email"
            label="Email address"
            hint="You will use this to log in."
            type="email"
            autoComplete="email"
            spellCheck={false}
            value={values.email}
            onChange={update('email')}
            error={errors.email}
          />
          <PasswordField
            id="password"
            label="Password"
            autoComplete="new-password"
            value={values.password}
            onChange={update('password')}
            error={errors.password}
            showRules
          />
          <PasswordField
            id="password_confirmation"
            label="Confirm password"
            hint="Type the same password again."
            autoComplete="new-password"
            value={values.password_confirmation}
            onChange={update('password_confirmation')}
            error={errors.password_confirmation}
          />
          <CheckboxField
            id="consent"
            checked={values.consent}
            onChange={update('consent')}
            error={errors.consent}
            hint={
              <>
                Please read the{' '}
                <Link
                  to="/privacy"
                  target="_blank"
                  rel="noopener"
                  className="font-bold text-primary underline underline-offset-4 hover:no-underline"
                >
                  privacy notice (opens in a new tab)
                </Link>{' '}
                to see what information OpenDoor collects and who can see it.
              </>
            }
            label="I have read the privacy notice and agree to OpenDoor collecting and using my information as described."
          />

          <Button type="submit" loading={submitting} loadingText="Creating account…">
            Create account
          </Button>
        </form>

        <p className="mt-8">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary underline underline-offset-4 hover:no-underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
