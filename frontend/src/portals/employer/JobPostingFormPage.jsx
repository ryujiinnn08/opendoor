import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { generalErrorFrom } from '../../api/client.js'
import { getDepartments, getEmployerProfile } from '../../api/employer.js'
import { createJobPosting, getJobPosting, updateJobPosting } from '../../api/jobPostings.js'
import { getAccommodationGroups, getCategories } from '../../api/masterData.js'
import { useAuth } from '../../auth/authContext.js'
import { employerKind } from '../../auth/employerAccess.js'
import AccommodationPicker from '../../components/postings/AccommodationPicker.jsx'
import PostingStatusBadge from '../../components/postings/PostingStatusBadge.jsx'
import Button from '../../components/ui/Button.jsx'
import ErrorSummary from '../../components/ui/ErrorSummary.jsx'
import FormField from '../../components/ui/FormField.jsx'
import LoadingMessage from '../../components/ui/LoadingMessage.jsx'
import Notice from '../../components/ui/Notice.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import RadioCardGroup from '../../components/ui/RadioCardGroup.jsx'
import SelectField from '../../components/ui/SelectField.jsx'
import { TEXT_LINK } from '../../components/ui/buttonLinkStyles.js'
import useFormErrors from '../../hooks/useFormErrors.js'
import { formatDay } from '../../lib/format.js'
import { closingDateRange, EMPLOYMENT_TYPES, INTERVIEW_FORMATS, WORK_SETUPS } from '../../lib/postingOptions.js'
import {
  emptyValues,
  mergeRetired,
  payloadFrom,
  pickerErrors,
  savedMessage,
  summaryItems,
  validatePosting,
  valuesFrom,
} from './postings/postingForm.js'

// Buttons by the posting's status (plan PHASE_2 §4.4); `submit` is what the API receives.
const BUTTONS = {
  draft: [
    { key: 'primary', label: 'Submit for approval', submit: true },
    { key: 'secondary', label: 'Save draft', submit: false },
  ],
  rejected: [
    { key: 'primary', label: 'Resubmit for approval', submit: true },
    { key: 'secondary', label: 'Save changes', submit: false },
  ],
  pending: [{ key: 'primary', label: 'Save changes', submit: false }],
  open: [{ key: 'primary', label: 'Save and send for approval', submit: false }],
  closed: [{ key: 'primary', label: 'Save and send for approval', submit: false }],
}

// Saving these keeps or sends them to approval, so they must stay complete (decisions 24, 26).
const ALWAYS_COMPLETE = ['pending', 'open', 'closed']

const asRadioOptions = (options) => options.map((option) => ({ value: option.value, title: option.label }))

function StatusNotice({ posting }) {
  switch (posting?.status) {
    case 'rejected':
      return (
        <Notice tone="error" className="mt-6">
          <p>
            <span className="font-bold">An OpenDoor admin rejected this posting.</span> Reason: {posting.rejection_reason}
          </p>
          <p className="mt-1">Make your changes, then resubmit it.</p>
        </Notice>
      )
    case 'pending':
      return (
        <Notice className="mt-6">This posting is waiting for approval. Your changes go to the same review.</Notice>
      )
    case 'open':
      return (
        <Notice className="mt-6">
          <p className="font-bold">Saving changes sends this posting back to an OpenDoor admin.</p>
          <p className="mt-1">
            Job seekers won't see it until it is approved again. To change only the closing date, use Change closing
            date on the Job postings page.
          </p>
        </Notice>
      )
    case 'closed':
      return (
        <Notice className="mt-6">
          <p className="font-bold">Saving changes sends this posting to an OpenDoor admin for approval.</p>
          <p className="mt-1">To open it again without changes, use Reopen on the Job postings page.</p>
        </Notice>
      )
    default:
      return null
  }
}

function FormSection({ id, title, children }) {
  return (
    <section aria-labelledby={id} className="border-t border-border pt-8 first:border-t-0 first:pt-0">
      <h2 id={id} className="mb-6 text-2xl font-bold">
        {title}
      </h2>
      {children}
    </section>
  )
}

/**
 * Create a job posting (/employer/job-postings/new) or edit one (/employer/job-postings/:id/edit).
 */
export default function JobPostingFormPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const { user } = useAuth()
  const navigate = useNavigate()
  const needsDepartment = employerKind(user) === 'owner' && user.membership.employer.type === 'company'
  const { errors, generalError, focusKey, show, showApiError } = useFormErrors()

  const [posting, setPosting] = useState(null)
  const [values, setValues] = useState(null)
  const [categories, setCategories] = useState([])
  const [groups, setGroups] = useState([])
  const [departments, setDepartments] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [saving, setSaving] = useState(null) // the key of the button being saved

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [categoryList, activeGroups, team, existing, profile] = await Promise.all([
          getCategories(),
          getAccommodationGroups(),
          needsDepartment ? getDepartments() : null,
          editing ? getJobPosting(id) : null,
          editing ? null : getEmployerProfile(),
        ])
        if (cancelled) return

        const departmentList = team?.departments ?? []
        setCategories(categoryList)
        setGroups(mergeRetired(activeGroups, existing?.accommodations ?? []))
        setDepartments(departmentList)
        setPosting(existing)
        setValues(
          existing
            ? valuesFrom(existing)
            : emptyValues({
                location: profile?.address ?? '',
                departmentId: departmentList.length === 1 ? String(departmentList[0].id) : '',
              }),
        )
      } catch (error) {
        if (!cancelled) setLoadError(generalErrorFrom(error))
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [editing, id, needsDepartment])

  const status = posting?.status ?? 'draft'
  const buttons = BUTTONS[status] ?? BUTTONS.draft
  const range = closingDateRange()

  function update(field) {
    return (event) => setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  async function save(button) {
    if (saving) return

    const submitting = button.submit || ALWAYS_COMPLETE.includes(status)
    const clientErrors = validatePosting(values, { submitting, needsDepartment, range })
    if (Object.keys(clientErrors).length) return show(clientErrors)

    setSaving(button.key)
    try {
      const payload = payloadFrom(values, { submit: button.submit, needsDepartment })
      const saved = editing ? await updateJobPosting(id, payload) : await createJobPosting(payload)
      navigate('/employer/job-postings', { state: { message: savedMessage({ before: posting?.status ?? null, saved }) } })
    } catch (error) {
      showApiError(error)
      setSaving(null)
    }
  }

  const heading = editing ? (posting ? `Edit ${posting.title}` : 'Edit job posting') : 'Create a job posting'

  // Every state keeps the same wrapper and heading, so the <h1> that got focus after navigation
  // is still there (and focused) when the form finishes loading.
  if (loadError) {
    return (
      <div className="max-w-3xl">
        <PageHeader title={heading} />
        <Notice tone="error" className="mt-6">
          <p>{loadError}</p>
          <Link to="/employer/job-postings" className={TEXT_LINK}>
            Back to job postings
          </Link>
        </Notice>
      </div>
    )
  }

  if (!values) {
    return (
      <div className="max-w-3xl">
        <PageHeader title={heading} />
        <LoadingMessage>Loading the form…</LoadingMessage>
      </div>
    )
  }

  const picker = pickerErrors(errors, values)

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={heading}
        intro={
          status === 'draft'
            ? 'Fill in every field to submit it for approval. You can save a draft at any time and finish it later.'
            : null
        }
      />
      {posting && (
        <p className="mt-4">
          <PostingStatusBadge status={posting.status} />
        </p>
      )}
      <StatusNotice posting={posting} />

      <div className="mt-8">
        <ErrorSummary errors={summaryItems(errors, values, generalError)} focusKey={focusKey} />

        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            save(buttons[0])
          }}
          className="space-y-10"
        >
          <FormSection id="section-job" title="The job">
            <FormField
              id="title"
              label="Job title"
              value={values.title}
              onChange={update('title')}
              error={errors.title}
              maxLength={150}
              inputClassName="max-w-xl"
            />
            {needsDepartment && (
              <SelectField
                id="department_id"
                label="Department"
                hint="HR officers in this department will see and manage the posting."
                placeholder="Choose a department"
                options={departments.map((department) => ({ value: String(department.id), label: department.name }))}
                value={values.department_id}
                onChange={update('department_id')}
                error={errors.department_id}
              />
            )}
            <SelectField
              id="category_id"
              label="Category"
              placeholder="Choose a category"
              options={categories.map((category) => ({ value: String(category.id), label: category.name }))}
              value={values.category_id}
              onChange={update('category_id')}
              error={errors.category_id}
            />
            <FormField
              id="description"
              as="textarea"
              rows={8}
              label="Description"
              hint="What the job involves and who it suits. Job seekers see this."
              value={values.description}
              onChange={update('description')}
              error={errors.description}
              maxLength={5000}
              inputClassName="max-w-2xl"
            />
          </FormSection>

          <FormSection id="section-where" title="Where and how">
            <FormField
              id="location"
              label="Location"
              hint='For remote jobs, e.g., "Anywhere in the Philippines".'
              value={values.location}
              onChange={update('location')}
              error={errors.location}
              maxLength={150}
              inputClassName="max-w-xl"
            />
            <RadioCardGroup
              name="work_setup"
              legend="Work setup"
              options={asRadioOptions(WORK_SETUPS)}
              value={values.work_setup}
              onChange={update('work_setup')}
              error={errors.work_setup}
              columns={3}
            />
            <RadioCardGroup
              name="employment_type"
              legend="Employment type"
              options={asRadioOptions(EMPLOYMENT_TYPES)}
              value={values.employment_type}
              onChange={update('employment_type')}
              error={errors.employment_type}
            />
            <RadioCardGroup
              name="interview_format"
              legend="Interview format"
              options={asRadioOptions(INTERVIEW_FORMATS)}
              value={values.interview_format}
              onChange={update('interview_format')}
              error={errors.interview_format}
              columns={3}
            />
          </FormSection>

          <FormSection id="section-accommodations" title="Accommodations">
            <AccommodationPicker
              id="accommodations"
              legend="Which accommodations does your workplace provide for this job?"
              hint="Job seekers see these first, with your notes."
              groups={groups}
              value={values.accommodations}
              onChange={(accommodations) => setValues((current) => ({ ...current, accommodations }))}
              error={picker.error}
              noteErrors={picker.noteErrors}
            />
          </FormSection>

          <FormSection id="section-closing" title="When applications close">
            <FormField
              id="closes_on"
              type="date"
              label="Closing date"
              hint={`Between ${formatDay(range.min)} and ${formatDay(range.max)}. Applications close at the end of that day, Philippine time.`}
              value={values.closes_on}
              onChange={update('closes_on')}
              error={errors.closes_on}
              min={range.min}
              max={range.max}
              inputClassName="max-w-xs"
            />
          </FormSection>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-8">
            {buttons.map((button) => (
              <Button
                key={button.key}
                type={button.key === 'primary' ? 'submit' : 'button'}
                variant={button.key === 'primary' ? 'primary' : 'secondary'}
                loading={saving === button.key}
                loadingText="Saving…"
                onClick={button.key === 'primary' ? undefined : () => save(button)}
              >
                {button.label}
              </Button>
            ))}
            <Link to="/employer/job-postings" className={`${TEXT_LINK} px-2`}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
