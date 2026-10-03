import { useEffect, useRef } from 'react'

/**
 * "There is a problem" box shown after a failed submit (GOV.UK pattern). It receives focus
 * whenever `focusKey` changes, and each error links to its field.
 *
 * errors: [{ id?: 'email', message: 'Enter your email address.' }]
 */
export default function ErrorSummary({ errors, focusKey }) {
  const ref = useRef(null)
  const hasErrors = errors.length > 0

  useEffect(() => {
    if (hasErrors) ref.current?.focus()
  }, [focusKey, hasErrors])

  if (!hasErrors) return null

  return (
    <div
      ref={ref}
      tabIndex={-1}
      aria-labelledby="error-summary-title"
      className="mb-8 rounded-md border-4 border-danger bg-surface p-4"
    >
      <h2 id="error-summary-title" className="text-xl font-bold">
        There is a problem
      </h2>
      <ul className="mt-2 list-none space-y-1">
        {errors.map((error) => (
          <li key={error.id ?? error.message}>
            {error.id ? (
              <a
                href={`#${error.id}`}
                onClick={(event) => {
                  event.preventDefault()
                  document.getElementById(error.id)?.focus()
                }}
                className="font-bold text-danger underline underline-offset-4"
              >
                {error.message}
              </a>
            ) : (
              <span className="font-bold text-danger">{error.message}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
