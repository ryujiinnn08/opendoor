import { useCallback, useState } from 'react'
import { fieldErrorsFrom, generalErrorFrom } from '../api/client.js'

/**
 * Error state for a form with an ErrorSummary: client-side errors, or the field and general
 * errors from a failed API call. Each call to show() moves focus to the summary again.
 */
export default function useFormErrors() {
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState(null)
  const [focusKey, setFocusKey] = useState(0)

  const show = useCallback((fieldErrors, general = null) => {
    setErrors(fieldErrors)
    setGeneralError(general)
    setFocusKey((key) => key + 1)
  }, [])

  const showApiError = useCallback(
    (error) => show(fieldErrorsFrom(error), generalErrorFrom(error)),
    [show],
  )

  const clear = useCallback(() => {
    setErrors({})
    setGeneralError(null)
  }, [])

  return { errors, generalError, focusKey, show, showApiError, clear }
}
