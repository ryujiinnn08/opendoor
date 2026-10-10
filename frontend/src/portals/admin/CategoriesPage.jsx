import { useCallback, useEffect, useRef, useState } from 'react'
import { fieldErrorsFrom, generalErrorFrom } from '../../api/client.js'
import { createCategory, deleteCategory, getCategories, updateCategory } from '../../api/masterData.js'
import { useAnnounce } from '../../components/ui/announcerContext.js'
import Button from '../../components/ui/Button.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import FormField from '../../components/ui/FormField.jsx'
import LoadingMessage from '../../components/ui/LoadingMessage.jsx'
import Notice from '../../components/ui/Notice.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'
import { inputClasses } from '../../components/ui/fieldStyles.js'

const byName = (a, b) => a.name.localeCompare(b.name)

/** Focus an element after React has rendered it. */
function focusById(id) {
  requestAnimationFrame(() => document.getElementById(id)?.focus())
}

export default function CategoriesPage() {
  const announce = useAnnounce()
  const listHeading = useRef(null)
  const justDeleted = useRef(false)

  const [categories, setCategories] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [message, setMessage] = useState(null)

  const [newName, setNewName] = useState('')
  const [addError, setAddError] = useState(null)
  const [adding, setAdding] = useState(false)

  const [editing, setEditing] = useState(null) // { id, name, error, saving }
  const [deleting, setDeleting] = useState(null) // { category, busy, error }

  const fetchCategories = useCallback(() => {
    getCategories()
      .then(setCategories)
      .catch((error) => setLoadError(generalErrorFrom(error)))
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  function retry() {
    setLoadError(null)
    fetchCategories()
  }

  function report(text) {
    setMessage(text)
    announce(text)
  }

  async function handleAdd(event) {
    event.preventDefault()
    if (adding) return
    if (!newName.trim()) {
      setAddError('Enter a category name.')
      focusById('new-category')
      return
    }
    setAdding(true)
    try {
      const created = await createCategory({ name: newName })
      setCategories((current) => [...current, created].sort(byName))
      setNewName('')
      setAddError(null)
      report(`Category "${created.name}" added.`)
    } catch (error) {
      setAddError(fieldErrorsFrom(error).name ?? generalErrorFrom(error))
      focusById('new-category')
    } finally {
      setAdding(false)
    }
  }

  function startEditing(category) {
    setEditing({ id: category.id, name: category.name, error: null, saving: false })
    focusById(`edit-name-${category.id}`)
  }

  function stopEditing(id) {
    setEditing(null)
    focusById(`rename-${id}`)
  }

  async function handleRename(event) {
    event.preventDefault()
    if (editing.saving) return
    if (!editing.name.trim()) {
      setEditing((current) => ({ ...current, error: 'Enter a category name.' }))
      focusById(`edit-name-${editing.id}`)
      return
    }
    setEditing((current) => ({ ...current, saving: true }))
    try {
      const updated = await updateCategory(editing.id, { name: editing.name })
      setCategories((current) => current.map((item) => (item.id === updated.id ? updated : item)).sort(byName))
      report(`Category renamed to "${updated.name}".`)
      stopEditing(updated.id)
    } catch (error) {
      setEditing((current) => ({
        ...current,
        saving: false,
        error: fieldErrorsFrom(error).name ?? generalErrorFrom(error),
      }))
      focusById(`edit-name-${editing.id}`)
    }
  }

  async function handleDelete() {
    const { category } = deleting
    setDeleting((current) => ({ ...current, busy: true, error: null }))
    try {
      await deleteCategory(category.id)
      setCategories((current) => current.filter((item) => item.id !== category.id))
      justDeleted.current = true
      setDeleting(null)
      report(`Category "${category.name}" deleted.`)
    } catch (error) {
      // A category used by job postings is refused with a message saying to rename it.
      setDeleting(
        (current) =>
          current && { ...current, busy: false, error: fieldErrorsFrom(error).category ?? generalErrorFrom(error) },
      )
    }
  }

  return (
    <>
      <PageHeading>Job categories</PageHeading>
      <p className="mt-4 max-w-prose">
        Categories group job postings by industry, so job seekers can browse and filter them.
      </p>

      {message && (
        <Notice tone="success" className="mt-6">
          {message}
        </Notice>
      )}

      <section className="mt-8 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-xl font-bold">Add a category</h2>
        <form onSubmit={handleAdd} noValidate className="mt-4 flex flex-wrap items-start gap-3">
          <FormField
            id="new-category"
            label="Category name"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            error={addError}
            maxLength={100}
            className="mb-0 w-full sm:w-auto sm:min-w-80"
          />
          <Button type="submit" loading={adding} loadingText="Adding…" className="sm:mt-8">
            Add category
          </Button>
        </form>
      </section>

      <section className="mt-10">
        <h2 ref={listHeading} tabIndex={-1} id="category-list" className="text-2xl font-bold outline-none">
          All categories{categories ? ` (${categories.length})` : ''}
        </h2>

        {loadError && (
          <Notice tone="error" className="mt-4">
            <p>{loadError}</p>
            <Button variant="link" onClick={retry}>
              Try again
            </Button>
          </Notice>
        )}
        {!categories && !loadError && <LoadingMessage>Loading categories…</LoadingMessage>}
        {categories?.length === 0 && <p className="mt-4">No categories yet. Add the first one above.</p>}

        {categories?.length > 0 && (
          <table aria-labelledby="category-list" className="mt-4 w-full border-collapse bg-surface">
            <thead>
              <tr className="border-b-2 border-muted text-left">
                <th scope="col" className="p-3">
                  Name
                </th>
                <th scope="col" className="p-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-border align-top">
                  {editing?.id === category.id ? (
                    <td colSpan={2} className="p-3">
                      <form onSubmit={handleRename} noValidate className="flex flex-wrap items-start gap-3">
                        <div className="w-full sm:w-auto sm:min-w-80">
                          <label htmlFor={`edit-name-${category.id}`} className="sr-only">
                            New name for {category.name}
                          </label>
                          {editing.error && (
                            <p id={`edit-name-${category.id}-error`} className="mb-1 font-bold text-danger">
                              <span className="sr-only">Error:</span> {editing.error}
                            </p>
                          )}
                          <input
                            id={`edit-name-${category.id}`}
                            value={editing.name}
                            maxLength={100}
                            onChange={(event) => setEditing((current) => ({ ...current, name: event.target.value }))}
                            aria-invalid={editing.error ? true : undefined}
                            aria-describedby={editing.error ? `edit-name-${category.id}-error` : undefined}
                            onKeyDown={(event) => event.key === 'Escape' && stopEditing(category.id)}
                            className={inputClasses(Boolean(editing.error))}
                          />
                        </div>
                        <Button type="submit" loading={editing.saving} loadingText="Saving…">
                          Save
                        </Button>
                        <Button variant="secondary" onClick={() => stopEditing(category.id)}>
                          Cancel
                        </Button>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="p-3 font-bold">{category.name}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            id={`rename-${category.id}`}
                            variant="secondary"
                            aria-label={`Rename ${category.name}`}
                            onClick={() => startEditing(category)}
                          >
                            Rename
                          </Button>
                          <Button
                            variant="secondary"
                            aria-label={`Delete ${category.name}`}
                            onClick={() => setDeleting({ category, busy: false, error: null })}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleting)}
        // Stays open while deleting, so a refusal can still be shown.
        onOpenChange={(open) => !open && setDeleting((current) => (current?.busy ? current : null))}
        title={deleting ? `Delete "${deleting.category.name}"?` : ''}
        description="Categories that job postings use can't be deleted; rename them instead. Deleting can't be undone."
        confirmLabel="Delete category"
        onConfirm={handleDelete}
        busy={deleting?.busy}
        error={deleting?.error}
        onCloseAutoFocus={(event) => {
          // The row's Delete button is gone after a deletion, so focus the list heading instead.
          if (justDeleted.current) {
            justDeleted.current = false
            event.preventDefault()
            listHeading.current?.focus()
          }
        }}
      />
    </>
  )
}
