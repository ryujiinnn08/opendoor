import { useEffect, useRef, useState } from 'react'
import Button from './Button.jsx'
import { useAnnounce } from './announcerContext.js'
import { describedBy, inputClasses } from './fieldStyles.js'

/**
 * A read-only link with a Copy button. "Link copied." is announced to screen readers; if the
 * browser blocks copying, the link is selected so the person can copy it with the keyboard.
 */
export default function CopyLinkBox({ id, label, value, hint }) {
  const announce = useAnnounce()
  const inputRef = useRef(null)
  const timer = useRef()
  const [copied, setCopied] = useState(false)
  const hintId = hint ? `${id}-hint` : null

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      announce('Link copied.')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 3000)
    } catch {
      inputRef.current?.select()
      announce('The link is selected. Press Control and C, or Command and C, to copy it.')
    }
  }

  return (
    <div>
      <label htmlFor={id} className="block font-bold">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mt-1 text-muted">
          {hint}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          ref={inputRef}
          id={id}
          type="text"
          readOnly
          value={value}
          onFocus={(event) => event.target.select()}
          aria-describedby={describedBy(hintId)}
          className={inputClasses(false, 'min-w-0 flex-1 font-mono text-sm')}
        />
        <Button onClick={copy}>{copied ? 'Copied' : 'Copy link'}</Button>
      </div>
    </div>
  )
}
