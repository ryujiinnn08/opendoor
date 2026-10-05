import { useEffect, useState } from 'react'
import { updateEmployerProfile } from '../../api/employer.js'
import { getCategories } from '../../api/masterData.js'
import Button from '../../components/ui/Button.jsx'
import ErrorSummary from '../../components/ui/ErrorSummary.jsx'
import FormField from '../../components/ui/FormField.jsx'
import useFormErrors from '../../hooks/useFormErrors.js'
import { summaryFrom } from '../../lib/errorSummary.js'

const FIELDS = ['name', 'industry', 'address', 'description']

/**
 * Edit form for a company profile or an individual employer profile.
 */
export default function EmployerProfileForm({ employer, onSaved }) {
  const company = employer.type === 'company'
  const { errors, generalError, focusKey, show, showApiError, clear } = useFormErrors()
  const [categories, setCategories] = useState([])
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState({
    name: employer.name ?? '',
    industry: employer.industry ?? '',
    address: employer.address ?? '',
    description: employer.description ?? '',
  })

  useEffect(() => {
    if (!company) return
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [company])

  function update(field) {
    return (event) => setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return

    const clientErrors = {}
    if (!values.name.trim()) clientErrors.name = company ? 'Enter the company name.' : 'Enter the name job seekers will see.'
    if (company && !values.industry.trim()) clientErrors.industry = "Enter the company's industry."
    if (!values.address.trim())
      clientErrors.address = company ? 'Enter the company address.' : 'Enter your city or municipality.'
    if (Object.keys(clientErrors).length) return show(clientErrors)

    setSaving(true)
    try {
      const saved = await updateEmployerProfile({ ...values, industry: company ? values.industry : null })
      clear()
      onSaved(saved)
    } catch (error) {
      showApiError(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <ErrorSummary errors={summaryFrom(errors, FIELDS, generalError)} focusKey={focusKey} />
      <form onSubmit={handleSubmit} noValidate>
        <FormField
          id="name"
          label={company ? 'Company name' : 'Name job seekers will see'}
          value={values.name}
          onChange={update('name')}
          error={errors.name}
          maxLength={200}
        />
        {company && (
          <>
            <FormField
              id="industry"
              label="Industry"
              hint="Choose a suggestion or type your own."
              list="industry-options"
              autoComplete="off"
              value={values.industry}
              onChange={update('industry')}
              error={errors.industry}
              maxLength={100}
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
          inputClassName="max-w-xl"
        />
        <FormField
          id="description"
          as="textarea"
          rows={5}
          label={company ? 'About the company' : 'About you'}
          hint="Shown to job seekers. Mention your workplace and how you support employees with disabilities."
          optional
          value={values.description}
          onChange={update('description')}
          error={errors.description}
          maxLength={2000}
          inputClassName="max-w-xl"
        />
        <Button type="submit" loading={saving} loadingText="Saving…">
          Save details
        </Button>
      </form>
    </>
  )
}
