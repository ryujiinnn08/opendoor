import { useState } from 'react'
import { formatDay } from '../../lib/format.js'
import { closingDateRange, inClosingDateRange } from '../../lib/postingOptions.js'
import Button from '../ui/Button.jsx'
import FormField from '../ui/FormField.jsx'
import Modal, { ModalClose } from '../ui/Modal.jsx'

/**
 * Asks for a new closing date, for Reopen and Change closing date; neither needs a new
 * approval (decisions 7 and 25). onConfirm('YYYY-MM-DD') gets a date in the allowed range.
 * `error` is a general message; `dateError` is the server's message about the date itself.
 */
export default function ClosingDateDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  initialDate = '',
  onConfirm,
  busy,
  error,
  dateError,
  onCloseAutoFocus,
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description={description} onCloseAutoFocus={onCloseAutoFocus}>
      {/* The content unmounts when the dialog closes, so each opening starts fresh. */}
      <DateForm
        confirmLabel={confirmLabel}
        initialDate={initialDate}
        onConfirm={onConfirm}
        busy={busy}
        error={error}
        dateError={dateError}
      />
    </Modal>
  )
}

function DateForm({ confirmLabel, initialDate, onConfirm, busy, error, dateError }) {
  const [day, setDay] = useState(initialDate)
  const [fieldError, setFieldError] = useState(null)
  const { min, max } = closingDateRange()

  function handleSubmit(event) {
    event.preventDefault()
    if (busy) return

    let message = null
    if (!day) message = 'Choose a new closing date.'
    else if (!inClosingDateRange(day, { min, max })) message = `Choose a closing date between ${formatDay(min)} and ${formatDay(max)}.`

    if (message) {
      setFieldError(message)
      document.getElementById('closes-on-dialog')?.focus()
      return
    }

    setFieldError(null)
    onConfirm(day)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <p role="alert" className="mb-4 font-bold text-danger">
          {error}
        </p>
      )}
      <FormField
        id="closes-on-dialog"
        type="date"
        label="New closing date"
        hint={`Between ${formatDay(min)} and ${formatDay(max)}.`}
        error={fieldError ?? dateError}
        value={day}
        onChange={(event) => setDay(event.target.value)}
        min={min}
        max={max}
        inputClassName="max-w-xs"
      />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={busy} loadingText="Saving…">
          {confirmLabel}
        </Button>
        <ModalClose asChild>
          <Button variant="secondary">Cancel</Button>
        </ModalClose>
      </div>
    </form>
  )
}
