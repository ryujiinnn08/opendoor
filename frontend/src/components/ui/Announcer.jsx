import { useCallback, useRef, useState } from 'react'
import { AnnouncerContext } from './announcerContext.js'

/**
 * One polite live region for the whole app. `announce('Category added.')` is read out by
 * screen readers without moving focus.
 */
export function AnnouncerProvider({ children }) {
  const [message, setMessage] = useState('')
  const timer = useRef()

  const announce = useCallback((text) => {
    // Clear first so repeating the same message is announced again.
    setMessage('')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMessage(text), 100)
  }, [])

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {message}
      </div>
    </AnnouncerContext.Provider>
  )
}
