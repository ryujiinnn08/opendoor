import { FieldError } from './FormField.jsx'
import { describedBy, inputClasses } from './fieldStyles.js'

/**
 * options: [{ value, label, disabled? }]
 */
export default function SelectField({ id, label, hint, error, options, placeholder, className = '', ...selectProps }) {
  const hintId = hint ? `${id}-hint` : null
  const errorId = error ? `${id}-error` : null

  return (
    <div className={`mb-6 ${className}`}>
      <label htmlFor={id} className="block font-bold">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mt-1 text-muted">
          {hint}
        </p>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
      <select
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hintId, errorId)}
        className={`mt-2 ${inputClasses(Boolean(error), 'max-w-md')}`}
        {...selectProps}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
