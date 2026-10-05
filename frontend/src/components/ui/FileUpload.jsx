import { useState } from 'react'
import Button from './Button.jsx'
import { FieldError } from './FormField.jsx'
import { describedBy } from './fieldStyles.js'

const TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_BYTES = 2 * 1024 * 1024

/**
 * Image upload with a preview of the current image. Checks type and size before uploading,
 * and shows the server's message if the upload is still refused.
 *
 * onUpload(file) and onRemove() return promises; throw an Error with a message to show it.
 */
export default function FileUpload({ id, label, currentUrl, previewAlt, onUpload, onRemove }) {
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(null) // 'upload' | 'remove'
  const [inputKey, setInputKey] = useState(0)
  const hintId = `${id}-hint`
  const errorId = error ? `${id}-error` : null

  function choose(event) {
    setError(null)
    setFile(event.target.files?.[0] ?? null)
  }

  async function upload(event) {
    event.preventDefault()
    if (busy) return
    if (!file) return setError('Choose an image file first.')
    if (!TYPES.includes(file.type)) return setError('The logo must be a PNG, JPG or WebP image.')
    if (file.size > MAX_BYTES) return setError('The logo must be smaller than 2 MB.')

    setBusy('upload')
    try {
      await onUpload(file)
      setFile(null)
      setInputKey((key) => key + 1)
    } catch (uploadError) {
      setError(uploadError.message)
    } finally {
      setBusy(null)
    }
  }

  async function remove() {
    if (busy) return
    setBusy('remove')
    setError(null)
    try {
      await onRemove()
    } catch (removeError) {
      setError(removeError.message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <form onSubmit={upload} noValidate className="flex flex-wrap items-start gap-6">
      <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-border bg-surface">
        {currentUrl ? (
          <img src={currentUrl} alt={previewAlt} className="size-full object-contain" />
        ) : (
          <span className="px-2 text-center text-sm text-muted">No image yet</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block font-bold">
          {label}
        </label>
        <p id={hintId} className="mt-1 text-muted">
          PNG, JPG or WebP, smaller than 2 MB. A square image looks best.
        </p>
        {error && <FieldError id={errorId}>{error}</FieldError>}
        <input
          key={inputKey}
          id={id}
          type="file"
          accept={TYPES.join(',')}
          onChange={choose}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(hintId, errorId)}
          className="mt-2 block w-full max-w-md text-sm file:mr-3 file:min-h-11 file:rounded-md file:border-2 file:border-primary file:bg-surface file:px-4 file:font-bold file:text-primary"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="submit" loading={busy === 'upload'} loadingText="Uploading…">
            Upload image
          </Button>
          {currentUrl && (
            <Button variant="secondary" onClick={remove} loading={busy === 'remove'} loadingText="Removing…">
              Remove image
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
