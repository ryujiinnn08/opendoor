import { useCallback, useEffect, useRef, useState } from 'react'
import { fieldErrorsFrom, generalErrorFrom } from '../../api/client.js'
import {
  createDepartment,
  createInvite,
  deleteDepartment,
  getDepartments,
  moveMember,
  removeMember,
  revokeInvite,
  updateDepartment,
} from '../../api/employer.js'
import { useAuth } from '../../auth/authContext.js'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import LoadingMessage from '../../components/ui/LoadingMessage.jsx'
import Notice from '../../components/ui/Notice.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'
import { useAnnounce } from '../../components/ui/announcerContext.js'
import AddDepartmentForm from './team/AddDepartmentForm.jsx'
import DepartmentCard from './team/DepartmentCard.jsx'
import MoveMemberDialog from './team/MoveMemberDialog.jsx'

function focusLater(id) {
  requestAnimationFrame(() => document.getElementById(id)?.focus())
}

/**
 * The owner's team: departments, HR limits, invite links and HR officers (plan PHASE_2 §4.3).
 */
export default function TeamPage() {
  const { user } = useAuth()
  const announce = useAnnounce()
  const companyName = user.membership.employer.name
  const listHeading = useRef(null)

  const [team, setTeam] = useState(null) // { departments, cap, defaultLimit }
  const [loadError, setLoadError] = useState(null)
  const [message, setMessage] = useState(null)
  const [newInvites, setNewInvites] = useState({}) // departmentId -> { url, expires_at }
  const [pending, setPending] = useState(null) // what's being confirmed: { kind, ... }

  const load = useCallback(
    () =>
      getDepartments()
        .then(setTeam)
        .catch((error) => setLoadError(generalErrorFrom(error))),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  function report(text) {
    setMessage(text)
    announce(text)
  }

  async function handleAddDepartment(values) {
    const created = await createDepartment(values)
    await load()
    report(`Department "${created.name}" added.`)
    focusLater(`department-${created.id}-heading`)
  }

  async function handleUpdateDepartment(department, values) {
    const updated = await updateDepartment(department.id, values)
    await load()
    report(`"${updated.name}" saved.`)
  }

  async function handleCreateInvite(department) {
    try {
      const invite = await createInvite(department.id)
      setNewInvites((current) => ({ ...current, [department.id]: invite }))
      await load()
      report(`Invite link created for ${department.name}. Copy it and send it to the person you're inviting.`)
      focusLater(`invite-link-${department.id}`)
    } catch (error) {
      report(fieldErrorsFrom(error).department ?? generalErrorFrom(error))
    }
  }

  async function confirmPending() {
    const action = pending
    setPending((current) => ({ ...current, busy: true, error: null }))
    try {
      if (action.kind === 'delete-department') {
        await deleteDepartment(action.department.id)
        report(`Department "${action.department.name}" deleted.`)
      } else if (action.kind === 'remove-member') {
        await removeMember(action.member.id)
        report(`${action.member.name} was removed from ${companyName}.`)
      } else if (action.kind === 'revoke-invite') {
        await revokeInvite(action.invite.id)
        setNewInvites((current) => {
          const next = { ...current }
          if (next[action.department.id]?.id === action.invite.id) delete next[action.department.id]
          return next
        })
        report(`Invite for ${action.department.name} revoked. Its place is free again.`)
      }
      await load()
      setPending({ ...action, done: true, open: false })
    } catch (error) {
      const fieldErrors = fieldErrorsFrom(error)
      setPending({ ...action, busy: false, error: Object.values(fieldErrors)[0] ?? generalErrorFrom(error) })
    }
  }

  async function handleMove(member, departmentId) {
    await moveMember(member.id, departmentId)
    const target = team.departments.find((department) => department.id === departmentId)
    await load()
    report(`${member.name} moved to ${target.name}.`)
  }

  const dialog = pending && dialogText(pending, companyName)

  return (
    <>
      <PageHeading>Team</PageHeading>
      <p className="mt-4 max-w-prose">
        Invite HR officers to your departments. Each HR officer sees and manages only their own department's job
        postings; you see everything.
        {team && ` OpenDoor allows up to ${team.cap} HR officers per department.`}
      </p>

      {message && (
        <Notice tone="success" className="mt-6">
          {message}
        </Notice>
      )}
      {loadError && (
        <Notice tone="error" className="mt-6">
          {loadError}
        </Notice>
      )}
      {!team && !loadError && <LoadingMessage>Loading your team…</LoadingMessage>}

      {team && (
        <>
          <AddDepartmentForm cap={team.cap} defaultLimit={team.defaultLimit} onAdd={handleAddDepartment} />

          <h2 ref={listHeading} id="departments-heading" tabIndex={-1} className="mt-10 text-2xl font-bold outline-none">
            Departments ({team.departments.length})
          </h2>
          <div className="mt-4 space-y-6">
            {team.departments.map((department) => (
              <DepartmentCard
                key={department.id}
                department={department}
                cap={team.cap}
                canDelete={team.departments.length > 1}
                newInvite={newInvites[department.id]}
                onUpdate={(values) => handleUpdateDepartment(department, values)}
                onCreateInvite={() => handleCreateInvite(department)}
                onDelete={() => setPending({ kind: 'delete-department', department, open: true })}
                onRevokeInvite={(invite) => setPending({ kind: 'revoke-invite', department, invite, open: true })}
                onMoveMember={(member) => setPending({ kind: 'move-member', department, member, open: true })}
                onRemoveMember={(member) => setPending({ kind: 'remove-member', department, member, open: true })}
              />
            ))}
          </div>
        </>
      )}

      {pending?.kind !== 'move-member' && (
        <ConfirmDialog
          open={Boolean(pending?.open)}
          onOpenChange={(open) => !open && setPending((current) => current && { ...current, open: false })}
          title={dialog?.title ?? ''}
          description={dialog?.description}
          confirmLabel={dialog?.confirmLabel ?? ''}
          onConfirm={confirmPending}
          busy={pending?.busy}
          error={pending?.error}
          onCloseAutoFocus={(event) => {
            // After a successful delete or remove, the button that opened the dialog is gone.
            if (!pending?.done) return
            event.preventDefault()
            if (pending.kind === 'delete-department') listHeading.current?.focus()
            else document.getElementById(`department-${pending.department.id}-heading`)?.focus()
            setPending(null)
          }}
        />
      )}

      {pending?.kind === 'move-member' && team && (
        <MoveMemberDialog
          open={Boolean(pending.open)}
          onOpenChange={(open) => !open && setPending(null)}
          member={pending.member}
          from={pending.department}
          departments={team.departments}
          onMove={async (departmentId) => {
            await handleMove(pending.member, departmentId)
            setPending(null)
            // The Move button that opened the dialog is now in another section.
            focusLater(`department-${departmentId}-heading`)
          }}
        />
      )}
    </>
  )
}

function dialogText(pending, companyName) {
  switch (pending.kind) {
    case 'delete-department':
      return {
        title: `Delete "${pending.department.name}"?`,
        description: 'Unused invite links for this department stop working. This cannot be undone.',
        confirmLabel: 'Delete department',
      }
    case 'remove-member':
      return {
        title: `Remove ${pending.member.name} from ${companyName}?`,
        description: `They will no longer see ${pending.department.name}'s job postings. Their OpenDoor account is not deleted, and postings they created stay with the department.`,
        confirmLabel: 'Remove from team',
      }
    case 'revoke-invite':
      return {
        title: 'Revoke this invite link?',
        description: `The link stops working right away, and its place in ${pending.department.name} becomes free.`,
        confirmLabel: 'Revoke link',
      }
    default:
      return null
  }
}
