import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { fieldErrorsFrom, generalErrorFrom } from '../../api/client.js'
import { getDepartments } from '../../api/employer.js'
import { changePostingStatus, deleteJobPosting, getJobPostings } from '../../api/jobPostings.js'
import { useAuth } from '../../auth/authContext.js'
import { employerKind } from '../../auth/employerAccess.js'
import ClosingDateDialog from '../../components/postings/ClosingDateDialog.jsx'
import Button from '../../components/ui/Button.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import FilterTabs from '../../components/ui/FilterTabs.jsx'
import LoadingMessage from '../../components/ui/LoadingMessage.jsx'
import Notice from '../../components/ui/Notice.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import SelectField from '../../components/ui/SelectField.jsx'
import { PRIMARY_LINK } from '../../components/ui/buttonLinkStyles.js'
import { useAnnounce } from '../../components/ui/announcerContext.js'
import { formatDay } from '../../lib/format.js'
import { POSTING_FILTERS } from '../../lib/postingOptions.js'
import PostingListItem from './postings/PostingListItem.jsx'

const EMPTY = {
  all: 'No job postings yet. Create one now, or save it as a draft and finish it later.',
  open: 'No open postings. Postings open after an OpenDoor admin approves them.',
  pending: 'Nothing is waiting for approval.',
  draft: 'No drafts.',
  rejected: 'No rejected postings.',
  closed: 'No closed postings.',
}

// With a department filter, the empty text names the department.
const EMPTY_IN_DEPARTMENT = {
  all: (name) => `No job postings in ${name} yet.`,
  open: (name) => `No open postings in ${name}.`,
  pending: (name) => `Nothing in ${name} is waiting for approval.`,
  draft: (name) => `No drafts in ${name}.`,
  rejected: (name) => `No rejected postings in ${name}.`,
  closed: (name) => `No closed postings in ${name}.`,
}

function successText(action, posting, updated) {
  switch (action) {
    case 'close':
      return `"${posting.title}" is closed.`
    case 'reopen':
      return `"${posting.title}" is open again until ${formatDay(updated.closes_on)}.`
    case 'change_closing_date':
      return `"${posting.title}" now closes on ${formatDay(updated.closes_on)}.`
    default:
      return `"${posting.title}" was deleted.`
  }
}

export default function JobPostingsPage() {
  const { user } = useAuth()
  const announce = useAnnounce()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const listHeading = useRef(null)

  const kind = employerKind(user)
  const { employer, department } = user.membership
  const ownsCompany = kind === 'owner' && employer.type === 'company'
  const status = POSTING_FILTERS.some((item) => item.value === searchParams.get('status')) ? searchParams.get('status') : 'all'
  // A department that isn't a whole number (e.g., a hand-edited address) is ignored, like an unknown status.
  const departmentParam = searchParams.get('department') ?? ''
  const departmentFilter = ownsCompany && /^\d+$/.test(departmentParam) ? departmentParam : ''

  // The list is kept with the filters it was loaded for, so a new filter shows "Loading…"
  // instead of the previous filter's postings.
  const filterKey = `${status}|${departmentFilter}`
  const [list, setList] = useState(null) // { key, items }
  const postings = list?.key === filterKey ? list.items : null
  const latestRequest = useRef(0)
  const [loadError, setLoadError] = useState(null)
  const [departments, setDepartments] = useState([])
  const [departmentsError, setDepartmentsError] = useState(null)
  // A message from the posting form (e.g., "sent for approval") is shown once.
  const [message, setMessage] = useState(() => location.state?.message ?? null)
  const [pending, setPending] = useState(null) // { action, posting, open, busy, error, dateError, done }

  const flash = location.state?.message
  useEffect(() => {
    if (!flash) return
    announce(flash)
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [flash, announce, navigate, location.pathname, location.search])

  const load = useCallback(() => {
    // Only the latest request may update the list; an earlier, slower one is ignored.
    const request = ++latestRequest.current
    return getJobPostings({ status, department: departmentFilter })
      .then((items) => {
        if (request !== latestRequest.current) return
        setList({ key: filterKey, items })
        setLoadError(null)
      })
      .catch((error) => {
        if (request === latestRequest.current) setLoadError(generalErrorFrom(error) ?? 'Something went wrong. Please try again.')
      })
  }, [status, departmentFilter, filterKey])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!ownsCompany) return
    getDepartments()
      .then((team) => setDepartments(team.departments))
      .catch(() => setDepartmentsError("We couldn't load your departments. Reload the page to try again."))
  }, [ownsCompany])

  function changeDepartment(event) {
    const next = new URLSearchParams(searchParams)
    if (event.target.value) next.set('department', event.target.value)
    else next.delete('department')
    setSearchParams(next)
  }

  async function confirmPending(closesOn) {
    const { action, posting } = pending
    setPending((current) => ({ ...current, busy: true, error: null, dateError: null }))
    try {
      const updated = action === 'delete' ? await deleteJobPosting(posting.id) : await changePostingStatus(posting.id, action, closesOn)
      await load()
      const text = successText(action, posting, updated)
      setMessage(text)
      announce(text)
      setPending((current) => current && { ...current, open: false, done: true })
    } catch (error) {
      // A refused date is shown on the date field; anything else above the form.
      const { closes_on: dateError, ...otherErrors } = fieldErrorsFrom(error)
      setPending(
        (current) =>
          current && {
            ...current,
            busy: false,
            dateError: dateError ?? null,
            error: dateError ? null : (Object.values(otherErrors)[0] ?? generalErrorFrom(error)),
          },
      )
    }
  }

  // The dialog stays open while its request runs, so the result is never lost.
  function closeDialog(open) {
    if (!open) setPending((current) => (current && !current.busy ? { ...current, open: false } : current))
  }

  // After an action the button that opened the dialog is often gone (Close becomes Reopen),
  // so focus moves to the posting's title, or to the list heading when the posting left the list.
  function afterClose(event) {
    if (pending?.done) {
      event.preventDefault()
      const row = document.getElementById(`posting-${pending.posting.id}`)
      ;(row?.querySelector('h3 a') ?? listHeading.current)?.focus()
    }
    setPending(null)
  }

  const intro = ownsCompany
    ? `${employer.name} job postings from every department. HR officers see only their own department's postings.`
    : kind === 'hr'
      ? `Job postings for ${department.name}, your department.`
      : 'Your job postings.'
  const filterLabel = status === 'all' ? 'All postings' : POSTING_FILTERS.find((item) => item.value === status).label
  const title = pending?.posting?.title ?? ''
  const departmentName = departments.find((item) => String(item.id) === departmentFilter)?.name ?? 'this department'
  const dialogProps = { onOpenChange: closeDialog, busy: pending?.busy, error: pending?.error, onCloseAutoFocus: afterClose }

  return (
    <>
      <PageHeader
        title="Job postings"
        intro={intro}
        actions={
          <Link to="/employer/job-postings/new" className={PRIMARY_LINK}>
            Create a job posting
          </Link>
        }
      />

      {message && (
        <Notice tone="success" className="mt-6">
          {message}
        </Notice>
      )}

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <FilterTabs label="Posting status" items={POSTING_FILTERS} current={status} />
        {ownsCompany && (
          <SelectField
            id="department-filter"
            label="Department"
            value={departmentFilter}
            onChange={changeDepartment}
            hint={departmentsError}
            options={[
              { value: '', label: 'All departments' },
              ...departments.map((item) => ({ value: String(item.id), label: item.name })),
            ]}
            className="mb-0 w-full sm:w-64"
          />
        )}
      </div>

      <h2 ref={listHeading} tabIndex={-1} className="mt-10 text-2xl font-bold outline-none">
        {filterLabel}
        {postings ? ` (${postings.length})` : ''}
      </h2>

      {loadError && (
        <Notice tone="error" className="mt-4">
          <p>{loadError}</p>
          <Button variant="link" onClick={load}>
            Try again
          </Button>
        </Notice>
      )}
      {!postings && !loadError && <LoadingMessage>Loading job postings…</LoadingMessage>}

      {postings?.length === 0 && (
        <div className="mt-4 max-w-prose">
          <p>{departmentFilter ? EMPTY_IN_DEPARTMENT[status](departmentName) : EMPTY[status]}</p>
          {status === 'all' && (
            <p className="mt-4">
              <Link to="/employer/job-postings/new" className={PRIMARY_LINK}>
                Create a job posting
              </Link>
            </p>
          )}
        </div>
      )}

      {postings?.length > 0 && (
        <ul className="mt-4">
          {postings.map((posting) => (
            <PostingListItem
              key={posting.id}
              posting={posting}
              showDepartment={employer.type === 'company'}
              showCreator={ownsCompany}
              onAction={(action, item) => setPending({ action, posting: item, open: true, busy: false, error: null })}
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        {...dialogProps}
        open={Boolean(pending?.open && pending.action === 'close')}
        title={`Close "${title}"?`}
        description="Job seekers won't see it until you reopen it. Reopening doesn't need a new approval."
        confirmLabel="Close posting"
        confirmVariant="primary"
        onConfirm={() => confirmPending()}
      />
      <ConfirmDialog
        {...dialogProps}
        open={Boolean(pending?.open && pending.action === 'delete')}
        title={`Delete "${title}"?`}
        description="It disappears from your job postings and from OpenDoor. This can't be undone."
        confirmLabel="Delete posting"
        onConfirm={() => confirmPending()}
      />
      <ClosingDateDialog
        {...dialogProps}
        open={Boolean(pending?.open && pending.action === 'reopen')}
        title={`Reopen "${title}"`}
        description="Choose a new closing date. Reopening doesn't need a new approval."
        dateError={pending?.dateError}
        confirmLabel="Reopen posting"
        onConfirm={confirmPending}
      />
      <ClosingDateDialog
        {...dialogProps}
        open={Boolean(pending?.open && pending.action === 'change_closing_date')}
        title={`Change the closing date of "${title}"`}
        description="The posting stays open. Changing only the date doesn't need a new approval."
        dateError={pending?.dateError}
        confirmLabel="Change closing date"
        initialDate={pending?.posting?.closes_on ?? ''}
        onConfirm={confirmPending}
      />
    </>
  )
}
