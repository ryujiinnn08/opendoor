import { FieldError } from './FormField.jsx'
import { describedBy } from './fieldStyles.js'

/**
 * A checkbox with its label beside it. Put links in `hint`, never in `label`: links inside a
 * label are skipped by some screen readers and tapping them can tick the box by accident.
 */
export default function CheckboxField({ id, label, hint, error, checked, onChange, className = '' }) {
  const hintId = hint ? `${id}-hint` : null
  const errorId = error ? `${id}-error` : null

  return (
    <div className={`mb-6 ${className}`}>
      {hint && (
        <p id={hintId} className="mb-2">
          {hint}
        </p>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
      <div className="mt-2 flex items-start gap-3">
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(hintId, errorId)}
          className={`mt-1 size-6 shrink-0 accent-primary ${error ? 'outline-2 outline-danger' : ''}`}
        />
        <label htmlFor={id} className="font-bold">
          {label}
        </label>
      </div>
    </div>
  )
}
