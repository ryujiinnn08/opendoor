import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { generalErrorFrom } from '../../api/client.js'
import { acceptInvite, getInvite } from '../../api/invites.js'
import { useAuth } from '../../auth/authContext.js'
import { employerKind } from '../../auth/employerAccess.js'
import Button from '../../components/ui/Button.jsx'
import CheckboxField from '../../components/ui/CheckboxField.jsx'
import ErrorSummary from '../../components/ui/ErrorSummary.jsx'
import FormField from '../../components/ui/FormField.jsx'
import LoadingMessage from '../../components/ui/LoadingMessage.jsx'
import Notice from '../../components/ui/Notice.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'
import PasswordField from '../../components/ui/PasswordField.jsx'
import { useAnnounce } from '../../components/ui/announcerContext.js'
import useFormErrors from '../../hooks/useFormErrors.js'
import { summaryFrom } from '../../lib/errorSummary.js'
import { formatDate } from '../../lib/format.js'
import { checkPassword } from '../../lib/passwordRules.js'

const FIELDS = ['name', 'email', 'password', 'password_confirmation', 'consent']

const PASSWORD_MESSAGES = {
  length: 'Use at least 8 characters.',
  upper: 'Add an uppercase letter (A-Z) and a lowercase letter (a-z).',
  lower: 'Add an uppercase letter (A-Z) and a lowercase letter (a-z).',
  number: 'Add a number (0-9).',
  symbol: 'Add a special character, such as ! or @.',
}

function validate(values) {
  const errors = {}
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

/**
 * The page an invite link opens: shows the company and department, then lets the HR officer
 * create an account (or join with their account if they have no employer profile yet).
 */
export default function JoinPage() {
  const { code } = useParams()
  const [invite, setInvite] = useState(null)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    getInvite(code)
      .then(setInvite)
      .catch((error) => setLoadError(generalErrorFrom(error)))
  }, [code])

  if (loadError) return <Unavailable message={loadError} />
  if (!invite) return <LoadingMessage>Checking your invite…</LoadingMessage>
  if (!invite.available) return <Unavailable message={invite.message} />

  return (
    <div className="max-w-2xl">
      <PageHeading title="Join a team">
        Join {invite.department} at {invite.company}
      </PageHeading>
      <p className="mt-4 max-w-prose">
        You've been invited to join as an HR officer. You'll see and manage {invite.department}'s job postings. This
        invite expires on {formatDate(invite.expires_at)}.
      </p>
      <JoinOptions code={code} invite={invite} />
    </div>
  )
}

function Unavailable({ message }) {
  return (
    <div className="max-w-2xl">
      <PageHeading>This invite link can't be used</PageHeading>
      <p className="mt-4">{message}</p>
      <p className="mt-2">Ask the company owner for a new invite link.</p>
      <p className="mt-6">
        <Link to="/" className="font-bold text-primary underline underline-offset-4 hover:no-underline">
          Go to the home page
        </Link>
      </p>
    </div>
  )
}

function JoinOptions({ code, invite }) {
  const { status, user, logout } = useAuth()
  const kind = employerKind(user)

  if (status === 'loading') return <LoadingMessage />

  if (status === 'authenticated' && kind === 'none') {
    return <JoinWithAccount code={code} invite={invite} />
  }

  if (status === 'authenticated') {
    return (
      <Notice tone="info" className="mt-8">
        <p>
          You're logged in as <span className="font-bold">{user.name}</span>, who can't join another company. Log out to
          accept this invite with a new account.
        </p>
        <Button variant="secondary" className="mt-3" onClick={logout}>
          Log out
        </Button>
      </Notice>
    )
  }

  return <JoinWithNewAccount code={code} invite={invite} />
}

function useJoin(code, invite) {
  const { refresh } = useAuth()
  const navigate = useNavigate()
  const announce = useAnnounce()

  return async (values) => {
    await acceptInvite(code, values)
    await refresh()
    announce(`Welcome to ${invite.company}. You're now an HR officer in ${invite.department}.`)
    navigate('/employer/dashboard', { replace: true })
  }
}

function JoinWithAccount({ code, invite }) {
  const { user } = useAuth()
  const join = useJoin(code, invite)
  const [error, setError] = useState(null)
  const [joining, setJoining] = useState(false)

  async function handleJoin() {
    setJoining(true)
    try {
      await join()
    } catch (joinError) {
      setError(Object.values(joinError?.response?.data?.errors ?? {})[0]?.[0] ?? generalErrorFrom(joinError))
      setJoining(false)
    }
  }

  return (
    <div className="mt-8">
      {error && (
        <Notice tone="error" className="mb-4">
          {error}
        </Notice>
      )}
      <p>
        You're logged in as <span className="font-bold">{user.name}</span>.
      </p>
      <Button className="mt-4" onClick={handleJoin} loading={joining} loadingText="Joining…">
        Join {invite.company}
      </Button>
    </div>
  )
}

function JoinWithNewAccount({ code, invite }) {
  const join = useJoin(code, invite)
  const { errors, generalError, focusKey, show, showApiError } = useFormErrors()
  const [submitting, setSubmitting] = useState(false)
  const [values, setValues] = useState({ name: '', email: '', password: '', password_confirmation: '', consent: false })

  function update(field) {
    return (event) => {
      const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
      setValues((current) => ({ ...current, [field]: value }))
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return

    const clientErrors = validate(values)
    if (Object.keys(clientErrors).length) return show(clientErrors)

    setSubmitting(true)
    try {
      await join({ ...values, name: values.name.trim(), email: values.email.trim().toLowerCase() })
    } catch (error) {
      showApiError(error)
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold">Create your account</h2>
      <p className="mt-2">
        Already have an OpenDoor employer account that isn't part of a company?{' '}
        <Link
          to={`/login?next=${encodeURIComponent(`/join/${code}`)}`}
          className="font-bold text-primary underline underline-offset-4 hover:no-underline"
        >
          Log in first
        </Link>
        , then you'll come back here.
      </p>

      <div className="mt-6">
        <ErrorSummary errors={summaryFrom(errors, FIELDS, generalError)} focusKey={focusKey} />
        <form onSubmit={handleSubmit} noValidate>
          <FormField id="name" label="Full name" autoComplete="name" value={values.name} onChange={update('name')} error={errors.name} />
          <FormField
            id="email"
            label="Work email address"
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
          <Button type="submit" loading={submitting} loadingText="Joining…">
            Create account and join
          </Button>
        </form>
      </div>
    </div>
  )
}
