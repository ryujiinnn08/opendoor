import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { decideCompany, getCompanies } from '../../api/admin.js'
import { fieldErrorsFrom, generalErrorFrom } from '../../api/client.js'
import Button from '../../components/ui/Button.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import FilterTabs from '../../components/ui/FilterTabs.jsx'
import LoadingMessage from '../../components/ui/LoadingMessage.jsx'
import Notice from '../../components/ui/Notice.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'
import ReasonDialog from '../../components/ui/ReasonDialog.jsx'
import { useAnnounce } from '../../components/ui/announcerContext.js'
import { formatDate, registrationLabel } from '../../lib/format.js'

const TABS = [
  { value: 'pending', label: 'Waiting' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
]

const EMPTY = {
  pending: 'No companies are waiting for review.',
  verified: 'No companies have been verified yet.',
  rejected: 'No companies have been rejected.',
}

export default function EmployerVerificationPage() {
  const announce = useAnnounce()
  const [searchParams] = useSearchParams()
  const status = TABS.some((tab) => tab.value === searchParams.get('status')) ? searchParams.get('status') : 'pending'
  const listHeading = useRef(null)

  const [companies, setCompanies] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [message, setMessage] = useState(null)
  const [deciding, setDeciding] = useState(null) // { company, decision, busy, error, done }

  const load = useCallback(() => {
    getCompanies(status)
      .then(setCompanies)
      .catch((error) => setLoadError(generalErrorFrom(error)))
  }, [status])

  useEffect(() => {
    load()
  }, [load])

  async function decide(reason) {
    const { company, decision } = deciding
    setDeciding((current) => ({ ...current, busy: true, error: null }))
    try {
      await decideCompany(company.id, decision, reason)
      setCompanies((current) => current.filter((item) => item.id !== company.id))
      const text = decision === 'approve' ? `"${company.name}" is now verified.` : `"${company.name}" was rejected. The owner can see your reason.`
      setMessage(text)
      announce(text)
      setDeciding((current) => ({ ...current, done: true, open: false }))
    } catch (error) {
      const fieldErrors = fieldErrorsFrom(error)
      setDeciding((current) => ({ ...current, busy: false, error: Object.values(fieldErrors)[0] ?? generalErrorFrom(error) }))
    }
  }

  function closeDialog(open) {
    if (!open) setDeciding((current) => current && { ...current, open: false })
  }

  function afterClose(event) {
    if (!deciding?.done) return
    event.preventDefault()
    listHeading.current?.focus()
    setDeciding(null)
  }

  const heading = TABS.find((tab) => tab.value === status).label

  return (
    <>
      <PageHeading>Employer verification</PageHeading>
      <p className="mt-4 max-w-prose">
        Check each registration number on the DTI, SEC or CDA website before verifying. Verified companies get a badge
        on their profile and job postings.
      </p>

      <div className="mt-6">
        <FilterTabs label="Verification status" items={TABS} current={status} />
      </div>

      {message && (
        <Notice tone="success" className="mt-6">
          {message}
        </Notice>
      )}

      <h2 ref={listHeading} tabIndex={-1} id="companies-heading" className="mt-8 text-2xl font-bold outline-none">
        {heading}
        {companies ? ` (${companies.length})` : ''}
      </h2>

      {loadError && (
        <Notice tone="error" className="mt-4">
          {loadError}
        </Notice>
      )}
      {!companies && !loadError && <LoadingMessage>Loading companies…</LoadingMessage>}
      {companies?.length === 0 && <p className="mt-4">{EMPTY[status]}</p>}

      <div className="mt-4 space-y-4">
        {companies?.map((company) => (
          <article key={company.id} aria-labelledby={`company-${company.id}`} className="rounded-lg border border-border bg-surface p-5">
            <h3 id={`company-${company.id}`} className="text-xl font-bold">
              {company.name}
            </h3>
            <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-[max-content_1fr]">
              <dt className="font-bold">Registration</dt>
              <dd>
                {registrationLabel(company.verification.registration_type)}{' '}
                <span className="font-mono">{company.verification.business_reg_no}</span>
              </dd>
              <dt className="font-bold">Industry</dt>
              <dd>{company.industry || '—'}</dd>
              <dt className="font-bold">Address</dt>
              <dd>{company.address || '—'}</dd>
              <dt className="font-bold">Owner</dt>
              <dd>{company.owner ? `${company.owner.name} (${company.owner.email})` : '—'}</dd>
              {status === 'pending' && (
                <>
                  <dt className="font-bold">Submitted</dt>
                  <dd>{formatDate(company.verification.submitted_at)}</dd>
                </>
              )}
              {status === 'verified' && (
                <>
                  <dt className="font-bold">Verified</dt>
                  <dd>{formatDate(company.verification.verified_at)}</dd>
                </>
              )}
              {status === 'rejected' && (
                <>
                  <dt className="font-bold">Reason</dt>
                  <dd>{company.verification.rejection_reason}</dd>
                </>
              )}
            </dl>
            {status === 'pending' && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  aria-label={`Verify ${company.name}`}
                  onClick={() => setDeciding({ company, decision: 'approve', open: true })}
                >
                  Verify
                </Button>
                <Button
                  variant="secondary"
                  aria-label={`Reject ${company.name}`}
                  onClick={() => setDeciding({ company, decision: 'reject', open: true })}
                >
                  Reject
                </Button>
              </div>
            )}
          </article>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(deciding?.open && deciding.decision === 'approve')}
        onOpenChange={closeDialog}
        title={deciding ? `Verify "${deciding.company.name}"?` : ''}
        description="Only verify after checking the registration number with the agency. The company will get the Verified badge."
        confirmLabel="Verify company"
        confirmVariant="primary"
        onConfirm={() => decide()}
        busy={deciding?.busy}
        error={deciding?.error}
        onCloseAutoFocus={afterClose}
      />
      <ReasonDialog
        open={Boolean(deciding?.open && deciding.decision === 'reject')}
        onOpenChange={closeDialog}
        title={deciding ? `Reject "${deciding.company.name}"?` : ''}
        description="The company owner will see your reason."
        hint="Say what they need to fix, e.g., the number does not match the company name."
        confirmLabel="Reject"
        onConfirm={decide}
        busy={deciding?.busy}
        error={deciding?.error}
        onCloseAutoFocus={afterClose}
      />
    </>
  )
}
