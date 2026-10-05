import { useState } from 'react'
import { fieldErrorsFrom, generalErrorFrom } from '../../../api/client.js'
import Button from '../../../components/ui/Button.jsx'
import CopyLinkBox from '../../../components/ui/CopyLinkBox.jsx'
import FormField from '../../../components/ui/FormField.jsx'
import PlacesCounter from '../../../components/ui/PlacesCounter.jsx'
import { formatDate } from '../../../lib/format.js'

/**
 * One department on the Team page: places, HR officers, unused invites and actions.
 */
export default function DepartmentCard({
  department,
  cap,
  canDelete,
  newInvite,
  onUpdate,
  onCreateInvite,
  onDelete,
  onRevokeInvite,
  onMoveMember,
  onRemoveMember,
}) {
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const headingId = `department-${department.id}-heading`

  async function createInvite() {
    setCreating(true)
    try {
      await onCreateInvite()
    } finally {
      setCreating(false)
    }
  }

  return (
    <section aria-labelledby={headingId} className="rounded-lg border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 id={headingId} tabIndex={-1} className="text-xl font-bold outline-none">
            {department.name}
          </h3>
          <div className="mt-2">
            <PlacesCounter
              used={department.places_used}
              limit={department.member_limit}
              effectiveLimit={department.effective_limit}
            />
          </div>
        </div>
        {!editing && (
          <div className="flex flex-wrap gap-2">
            <Button
              id={`edit-department-${department.id}`}
              variant="secondary"
              aria-label={`Edit ${department.name}`}
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
            {canDelete && (
              <Button variant="secondary" aria-label={`Delete ${department.name}`} onClick={onDelete}>
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {editing && (
        <EditDepartmentForm
          department={department}
          cap={cap}
          onCancel={() => {
            setEditing(false)
            requestAnimationFrame(() => document.getElementById(`edit-department-${department.id}`)?.focus())
          }}
          onSave={async (values) => {
            await onUpdate(values)
            setEditing(false)
            requestAnimationFrame(() => document.getElementById(`edit-department-${department.id}`)?.focus())
          }}
        />
      )}

      <h4 className="mt-6 text-lg font-bold">HR officers</h4>
      {department.hr_officers.length === 0 ? (
        <p className="mt-2 text-muted">No HR officers yet.</p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {department.hr_officers.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-bold">{member.name}</p>
                <p className="text-muted">
                  {member.email} · joined {formatDate(member.joined_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" aria-label={`Move ${member.name}`} onClick={() => onMoveMember(member)}>
                  Move
                </Button>
                <Button variant="secondary" aria-label={`Remove ${member.name}`} onClick={() => onRemoveMember(member)}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {department.open_invites.length > 0 && (
        <>
          <h4 className="mt-6 text-lg font-bold">Unused invite links</h4>
          <ul className="mt-2 divide-y divide-border">
            {department.open_invites.map((invite) => (
              <li key={invite.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <p>
                  Created {formatDate(invite.created_at)} · expires {formatDate(invite.expires_at)}
                </p>
                <Button
                  variant="secondary"
                  aria-label={`Revoke invite created ${formatDate(invite.created_at)}`}
                  onClick={() => onRevokeInvite(invite)}
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-6">
        {newInvite && (
          <div className="mb-4 rounded-md border-2 border-primary bg-primary-soft p-4">
            <CopyLinkBox
              id={`invite-link-${department.id}`}
              label={`New invite link for ${department.name}`}
              hint={`Send it to the person you're inviting. It works once and expires on ${formatDate(newInvite.expires_at)}. You won't see this link again after leaving this page.`}
              value={newInvite.url}
            />
          </div>
        )}
        {department.has_free_place ? (
          <Button onClick={createInvite} loading={creating} loadingText="Creating…">
            Create invite link
          </Button>
        ) : (
          <p className="max-w-prose text-muted">
            This department is full. Raise its limit, revoke an unused invite, or move or remove someone to invite
            more people.
          </p>
        )}
      </div>
    </section>
  )
}

function EditDepartmentForm({ department, cap, onCancel, onSave }) {
  const [name, setName] = useState(department.name)
  const [limit, setLimit] = useState(String(department.member_limit))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const nameId = `department-${department.id}-name`
  const limitId = `department-${department.id}-limit`

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return

    const parsed = Number(limit)
    const clientErrors = {}
    if (!name.trim()) clientErrors.name = 'Enter a department name.'
    if (!Number.isInteger(parsed) || parsed < 1) clientErrors.member_limit = 'Enter a whole number of at least 1.'
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      document.getElementById(clientErrors.name ? nameId : limitId)?.focus()
      return
    }

    setSaving(true)
    try {
      await onSave({ name: name.trim(), member_limit: parsed })
    } catch (error) {
      const fieldErrors = fieldErrorsFrom(error)
      setErrors(Object.keys(fieldErrors).length ? fieldErrors : { name: generalErrorFrom(error) })
      document.getElementById(fieldErrors.member_limit ? limitId : nameId)?.focus()
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(event) => event.key === 'Escape' && onCancel()}
      noValidate
      className="mt-4 flex flex-wrap items-end gap-x-4 rounded-md bg-bg p-4"
    >
      <FormField
        id={nameId}
        label="Department name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={errors.name}
        maxLength={100}
        autoFocus
        className="w-full sm:w-auto sm:min-w-64"
      />
      <FormField
        id={limitId}
        label="HR officer limit"
        hint={`Up to ${cap}`}
        type="number"
        inputMode="numeric"
        min={1}
        value={limit}
        onChange={(event) => setLimit(event.target.value)}
        error={errors.member_limit}
        inputClassName="w-28"
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <Button type="submit" loading={saving} loadingText="Saving…">
          Save
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
