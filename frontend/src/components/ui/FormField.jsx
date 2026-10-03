import { describedBy, inputClasses } from './fieldStyles.js'

/**
 * A labelled input with optional hint and error. The error is linked to the input with
 * aria-describedby and marked with aria-invalid so screen readers announce it.
 * Pass `as="textarea"` for multi-line text.
 */
export default function FormField({
  id,
  label,
  hint,
  error,
  optional = false,
  as: Control = 'input',
  className = '',
  inputClassName = 'max-w-md',
  ...controlProps
}) {
  const hintId = hint ? `${id}-hint` : null
  const errorId = error ? `${id}-error` : null

  return (
    <div className={`mb-6 ${className}`}>
      <label htmlFor={id} className="block font-bold">
        {label}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {hint && (
        <p id={hintId} className="mt-1 text-muted">
          {hint}
        </p>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
      <Control
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hintId, errorId)}
        className={`mt-2 ${inputClasses(Boolean(error), inputClassName)}`}
        {...controlProps}
      />
    </div>
  )
}

export function FieldError({ id, children }) {
  return (
    <p id={id} className="mt-1 font-bold text-danger">
      <span className="sr-only">Error:</span> {children}
    </p>
  )
}
