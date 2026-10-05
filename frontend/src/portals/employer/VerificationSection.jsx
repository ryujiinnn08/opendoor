import { useState } from 'react'
import { submitVerification } from '../../api/employer.js'
import Button from '../../components/ui/Button.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import ErrorSummary from '../../components/ui/ErrorSummary.jsx'
import FormField from '../../components/ui/FormField.jsx'
import Notice from '../../components/ui/Notice.jsx'
import RadioCardGroup from '../../components/ui/RadioCardGroup.jsx'
import VerificationBadge from '../../components/ui/VerificationBadge.jsx'
import useFormErrors from '../../hooks/useFormErrors.js'
import { summaryFrom } from '../../lib/errorSummary.js'
import { formatDate, registrationLabel, REGISTRATION_TYPES } from '../../lib/format.js'

const FIELDS = ['registration_type', 'business_reg_no']
const FIELD_IDS = { registration_type: 'registration_type-dti' }
const NUMBER_PATTERN = /^[A-Z0-9-]{5,20}$/

const EXPLANATIONS = {
  not_submitted: 'Enter your registration number so an OpenDoor admin can check it. Verified companies get a badge on every job posting.',
  pending: 'An OpenDoor admin is checking your registration number. You can keep using OpenDoor while you wait.',
  verified: 'Your company is verified. The badge appears on your profile and your job postings.',
  rejected: 'Your registration number could not be verified. Correct it below and submit it again.',
}

/**
 * The owner's verification panel: current status, the admin's reason if rejected, and the
 * registration number form (plan PHASE_2 §4.5).
 */
export default function VerificationSection({ employer, onSaved }) {
  const verification = employer.verification
  const { errors, generalError, focusKey, show, showApiError, clear } = useFormErrors()
  const [values, setValues] = useState({
    registration_type: verification.registration_type ?? '',
    business_reg_no: verification.business_reg_no ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const normalizedNumber = values.business_reg_no.replace(/\s+/g, '').toUpperCase()
  const changesVerifiedNumber =
    verification.status === 'verified' &&
    (values.registration_type !== verification.registration_type || normalizedNumber !== verification.business_reg_no)

  function update(field) {
    return (event) => setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  async function save() {
    setSaving(true)
    try {
      const saved = await submitVerification({ ...values, business_reg_no: normalizedNumber })
      clear()
      setConfirming(false)
      onSaved(saved)
    } catch (error) {
      setConfirming(false)
      showApiError(error)
    } finally {
      setSaving(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (saving) return

    const clientErrors = {}
    if (!values.registration_type) clientErrors.registration_type = 'Choose the agency your business is registered with.'
    if (!normalizedNumber) clientErrors.business_reg_no = 'Enter the registration number.'
    else if (!NUMBER_PATTERN.test(normalizedNumber))
      clientErrors.business_reg_no = 'Enter 5 to 20 letters, numbers or dashes, exactly as on your certificate.'
    if (Object.keys(clientErrors).length) return show(clientErrors)

    if (changesVerifiedNumber) return setConfirming(true)
    save()
  }

  const summary = summaryFrom(errors, FIELDS, generalError).map((item) =>
    item.id && FIELD_IDS[item.id] ? { ...item, id: FIELD_IDS[item.id] } : item,
  )
  const submitLabel = {
    not_submitted: 'Submit for verification',
    pending: 'Update number',
    verified: 'Save number',
    rejected: 'Submit again',
  }[verification.status]

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <VerificationBadge status={verification.status} />
        {verification.status === 'verified' && verification.verified_at && (
          <span className="text-muted">since {formatDate(verification.verified_at)}</span>
        )}
        {verification.status === 'pending' && verification.submitted_at && (
          <span className="text-muted">submitted {formatDate(verification.submitted_at)}</span>
        )}
      </div>
      <p className="mt-3 max-w-prose">{EXPLANATIONS[verification.status]}</p>

      {verification.status === 'rejected' && verification.rejection_reason && (
        <Notice tone="error" className="mt-4">
          <p className="font-bold">Reason from the OpenDoor admin:</p>
          <p>{verification.rejection_reason}</p>
        </Notice>
      )}

      {verification.business_reg_no && (
        <p className="mt-4">
          Current number: <span className="font-bold">{registrationLabel(verification.registration_type)}</span>{' '}
          <span className="font-mono">{verification.business_reg_no}</span>
        </p>
      )}

      <div className="mt-6">
        <ErrorSummary errors={summary} focusKey={focusKey} />
        <form onSubmit={handleSubmit} noValidate>
          <RadioCardGroup
            name="registration_type"
            legend="Registered with"
            options={REGISTRATION_TYPES.map((type) => ({ value: type.value, title: type.label, text: type.text }))}
            value={values.registration_type}
            onChange={update('registration_type')}
            error={errors.registration_type}
            columns={3}
          />
          <FormField
            id="business_reg_no"
            label="Registration number"
            hint={
              changesVerifiedNumber
                ? 'Changing the number removes your Verified badge until an admin checks the new one.'
                : 'Exactly as on your certificate: 5 to 20 letters, numbers or dashes.'
            }
            value={values.business_reg_no}
            onChange={update('business_reg_no')}
            error={errors.business_reg_no}
            maxLength={30}
            autoComplete="off"
            spellCheck={false}
          />
          <Button type="submit" loading={saving && !confirming} loadingText="Submitting…">
            {submitLabel}
          </Button>
        </form>
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Change your registration number?"
        description="Your Verified badge will be removed until an OpenDoor admin checks the new number."
        confirmLabel="Change number"
        onConfirm={save}
        busy={saving}
      />
    </>
  )
}
