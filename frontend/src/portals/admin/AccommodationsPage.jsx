import { useCallback, useEffect, useMemo, useState } from 'react'
import { generalErrorFrom } from '../../api/client.js'
import { getAdminAccommodations, setAccommodationActive } from '../../api/masterData.js'
import { useAnnounce } from '../../components/ui/announcerContext.js'
import Button from '../../components/ui/Button.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import LoadingMessage from '../../components/ui/LoadingMessage.jsx'
import Notice from '../../components/ui/Notice.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import AccommodationFormDialog from './AccommodationFormDialog.jsx'

/** Group a list (already sorted by the API) while keeping the group order. */
function groupByName(items) {
  const groups = new Map()
  for (const item of items) {
    if (!groups.has(item.group_name)) groups.set(item.group_name, [])
    groups.get(item.group_name).push(item)
  }
  return [...groups.entries()]
}

export default function AccommodationsPage() {
  const announce = useAnnounce()
  const [items, setItems] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [message, setMessage] = useState(null)
  const [form, setForm] = useState({ open: false, accommodation: null })
  const [retiring, setRetiring] = useState(null) // { accommodation, busy, error }
  const [restoringId, setRestoringId] = useState(null)

  const fetchItems = useCallback(() => {
    getAdminAccommodations()
      .then(setItems)
      .catch((error) => setLoadError(generalErrorFrom(error)))
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  function retry() {
    setLoadError(null)
    fetchItems()
  }

  const grouped = useMemo(() => (items ? groupByName(items) : []), [items])
  const groupNames = grouped.map(([name]) => name)

  function report(text) {
    setMessage(text)
    announce(text)
  }

  function replaceItem(saved) {
    const existing = items.find((item) => item.id === saved.id)
    // A new or regrouped item is reloaded so it lands in the right group and order.
    if (!existing || existing.group_name !== saved.group_name) {
      fetchItems()
      return
    }
    setItems((current) => current.map((item) => (item.id === saved.id ? saved : item)))
  }

  function handleSaved(saved, isEdit) {
    replaceItem(saved)
    setForm({ open: false, accommodation: null })
    report(isEdit ? `"${saved.name}" updated.` : `"${saved.name}" added to ${saved.group_name}.`)
  }

  async function handleRetire() {
    const { accommodation } = retiring
    setRetiring((current) => ({ ...current, busy: true, error: null }))
    try {
      const saved = await setAccommodationActive(accommodation.id, false)
      replaceItem(saved)
      setRetiring(null)
      report(`"${saved.name}" retired. It is hidden from forms and filters.`)
    } catch (error) {
      setRetiring((current) => ({ ...current, busy: false, error: generalErrorFrom(error) }))
    }
  }

  async function handleRestore(accommodation) {
    setRestoringId(accommodation.id)
    try {
      const saved = await setAccommodationActive(accommodation.id, true)
      replaceItem(saved)
      report(`"${saved.name}" restored. It is available in forms and filters again.`)
    } catch (error) {
      report(generalErrorFrom(error))
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <>
      <PageHeading>Accommodation types</PageHeading>
      <p className="mt-4 max-w-prose">
        The shared list used in candidate profiles, job postings, search filters and feedback. Types that are no longer
        needed are retired instead of deleted, so existing job postings and feedback stay correct.
      </p>

      {message && (
        <Notice tone="success" className="mt-6">
          {message}
        </Notice>
      )}

      <div className="mt-6">
        <Button onClick={() => setForm({ open: true, accommodation: null })}>Add accommodation type</Button>
      </div>

      {loadError && (
        <Notice tone="error" className="mt-6">
          <p>{loadError}</p>
          <Button variant="link" onClick={retry}>
            Try again
          </Button>
        </Notice>
      )}
      {!items && !loadError && <LoadingMessage>Loading accommodation types…</LoadingMessage>}

      {grouped.map(([groupName, groupItems]) => {
        const headingId = `group-${groupName.replace(/\W+/g, '-').toLowerCase()}`
        return (
          <section key={groupName} className="mt-10">
            <h2 id={headingId} className="text-2xl font-bold">
              {groupName}
            </h2>
            <table aria-labelledby={headingId} className="mt-4 w-full border-collapse bg-surface">
              <thead>
                <tr className="border-b-2 border-muted text-left">
                  <th scope="col" className="p-3">
                    Accommodation
                  </th>
                  <th scope="col" className="hidden p-3 sm:table-cell">
                    Status
                  </th>
                  <th scope="col" className="p-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {groupItems.map((item) => (
                  <tr key={item.id} className="border-b border-border align-top">
                    <td className="p-3">
                      <span className={`block font-bold ${item.is_active ? '' : 'text-muted'}`}>{item.name}</span>
                      {item.description && <span className="block text-muted">{item.description}</span>}
                      {/* On small screens the status sits under the name instead of in its own column. */}
                      <span className="mt-2 block sm:hidden">
                        <AccommodationStatus active={item.is_active} />
                      </span>
                    </td>
                    <td className="hidden p-3 sm:table-cell">
                      <AccommodationStatus active={item.is_active} />
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          aria-label={`Edit ${item.name}`}
                          onClick={() => setForm({ open: true, accommodation: item })}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          aria-label={`${item.is_active ? 'Retire' : 'Restore'} ${item.name}`}
                          loading={restoringId === item.id}
                          loadingText="Restoring…"
                          onClick={() =>
                            item.is_active
                              ? setRetiring({ accommodation: item, busy: false, error: null })
                              : handleRestore(item)
                          }
                        >
                          {item.is_active ? 'Retire' : 'Restore'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )
      })}

      <AccommodationFormDialog
        open={form.open}
        onOpenChange={(open) => !open && setForm({ open: false, accommodation: null })}
        accommodation={form.accommodation}
        groups={groupNames}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(retiring)}
        onOpenChange={(open) => !open && setRetiring(null)}
        title={retiring ? `Retire "${retiring.accommodation.name}"?` : ''}
        description="It will be hidden from profiles, job posting forms and search filters. Existing job postings and feedback keep it. You can restore it at any time."
        confirmLabel="Retire"
        onConfirm={handleRetire}
        busy={retiring?.busy}
        error={retiring?.error}
      />
    </>
  )
}

function AccommodationStatus({ active }) {
  return active ? <StatusBadge tone="success">Active</StatusBadge> : <StatusBadge tone="neutral">Retired</StatusBadge>
}
