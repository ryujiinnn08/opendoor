import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setupEmployer } from '../../api/employer.js'
import { getCategories } from '../../api/masterData.js'
import { useAuth } from '../../auth/authContext.js'
import Button from '../../components/ui/Button.jsx'
import ErrorSummary from '../../components/ui/ErrorSummary.jsx'
import FormField from '../../components/ui/FormField.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'
import RadioCardGroup from '../../components/ui/RadioCardGroup.jsx'
import { useAnnounce } from '../../components/ui/announcerContext.js'
import useFormErrors from '../../hooks/useFormErrors.js'
import { summaryFrom } from '../../lib/errorSummary.js'

const TYPES = [
  {
    value: 'company',
    title: 'A company or organization',
    text: 'A business registered with DTI, SEC or CDA. You can add departments and invite HR officers.',
  },
  {
    value: 'individual',
    title: 'Myself',
    text: 'You are hiring for yourself, for example for your household or as a freelancer.',
  },
]

const FIELDS = ['type', 'name', 'industry', 'address']
const FIELD_IDS = { type: 'type-company' }

function validate(values) {
  const company = values.type === 'company'
  const errors = {}
  if (!values.type) errors.type = 'Choose whether you are hiring for a company or for yourself.'
  if (!values.name.trim()) errors.name = company ? 'Enter the company name.' : 'Enter the name job seekers will see.'
  if (company && !values.industry.trim()) errors.industry = "Enter the company's industry."
  if (!values.address.trim())
    errors.address = company ? 'Enter the company address.' : 'Enter your city or municipality.'
  return errors
}

export default function SetupPage() {
  const { user, refresh } = useAuth()
  const navigate = useNavigate()
  const announce = useAnnounce()
  const { errors, generalError, focusKey, show, showApiError } = useFormErrors()
  const [values, setValues] = useState({ type: '', name: '', industry: '', address: '' })
  const [categories, setCategories] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const company = values.type === 'company'

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  function update(field) {
    return (event) => {
      const value = event.target.value
      setValues((current) => {
        const next = { ...current, [field]: value }
        // Suggest the person's own name when they choose "Myself".
        if (field === 'type' && value === 'individual' && !current.name) next.name = user.name
        return next
      })
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return

    const clientErrors = validate(values)
    if (Object.keys(clientErrors).length) return show(clientErrors)

    setSubmitting(true)
    try {
      await setupEmployer({ ...values, industry: company ? values.industry : null })
      await refresh()
      announce('Your employer profile is ready.')
      navigate('/employer/dashboard', { replace: true })
    } catch (error) {
      showApiError(error)
      setSubmitting(false)
    }
  }

  const summary = summaryFrom(errors, FIELDS, generalError).map((item) =>
    item.id && FIELD_IDS[item.id] ? { ...item, id: FIELD_IDS[item.id] } : item,
  )

  return (
    <div className="max-w-2xl">
      <PageHeading>Set up your employer profile</PageHeading>
      <p className="mt-4">
        Job seekers see this on your job postings. Were you invited to join a company's team? Open the invite link you
        received instead.
      </p>

      <div className="mt-8">
        <ErrorSummary errors={summary} focusKey={focusKey} />

        <form onSubmit={handleSubmit} noValidate>
          <RadioCardGroup
            name="type"
            legend="Who are you hiring for?"
            options={TYPES}
            value={values.type}
            onChange={update('type')}
            error={errors.type}
          />

          {values.type && (
            <>
              <FormField
                id="name"
                label={company ? 'Company name' : 'Name job seekers will see'}
                hint={company ? 'As registered with DTI, SEC or CDA.' : 'Usually your full name.'}
                value={values.name}
                onChange={update('name')}
                error={errors.name}
                maxLength={200}
                autoComplete={company ? 'organization' : 'name'}
              />
              {company && (
                <>
                  <FormField
                    id="industry"
                    label="Industry"
                    hint="Choose a suggestion or type your own."
                    list="industry-options"
                    value={values.industry}
                    onChange={update('industry')}
                    error={errors.industry}
                    maxLength={100}
                    autoComplete="off"
                  />
                  <datalist id="industry-options">
                    {categories.map((category) => (
                      <option key={category.id} value={category.name} />
                    ))}
                  </datalist>
                </>
              )}
              <FormField
                id="address"
                label={company ? 'Company address' : 'City or municipality'}
                value={values.address}
                onChange={update('address')}
                error={errors.address}
                maxLength={255}
                autoComplete={company ? 'street-address' : 'address-level2'}
                inputClassName="max-w-xl"
              />
            </>
          )}

          <Button type="submit" loading={submitting} loadingText="Saving…">
            Continue
          </Button>
        </form>
      </div>
    </div>
  )
}
