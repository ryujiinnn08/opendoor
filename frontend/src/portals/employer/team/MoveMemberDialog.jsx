import { useState } from 'react'
import { fieldErrorsFrom, generalErrorFrom } from '../../../api/client.js'
import Button from '../../../components/ui/Button.jsx'
import Modal, { ModalClose } from '../../../components/ui/Modal.jsx'
import SelectField from '../../../components/ui/SelectField.jsx'

/**
 * Moves an HR officer to another department; full departments are listed but can't be chosen.
 */
export default function MoveMemberDialog({ open, onOpenChange, member, from, departments, onMove }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={`Move ${member.name}`} description={`Currently in ${from.name}.`}>
      <MoveForm from={from} departments={departments} onMove={onMove} />
    </Modal>
  )
}

function MoveForm({ from, departments, onMove }) {
  const others = departments.filter((department) => department.id !== from.id)
  const [departmentId, setDepartmentId] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return
    if (!departmentId) {
      setError('Choose a department.')
      document.getElementById('move-department')?.focus()
      return
    }
    setSaving(true)
    try {
      await onMove(Number(departmentId))
    } catch (moveError) {
      setError(fieldErrorsFrom(moveError).department_id ?? generalErrorFrom(moveError))
      setSaving(false)
    }
  }

  if (others.length === 0) {
    return (
      <>
        <p>Your company has no other departments yet. Add one on the Team page first.</p>
        <ModalClose asChild>
          <Button variant="secondary" className="mt-6">
            Close
          </Button>
        </ModalClose>
      </>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <SelectField
        id="move-department"
        label="Move to"
        hint="Departments with no free places can't be chosen."
        placeholder="Choose a department"
        value={departmentId}
        onChange={(event) => setDepartmentId(event.target.value)}
        error={error}
        options={others.map((department) => ({
          value: String(department.id),
          label: `${department.name} (${department.places_used} of ${department.effective_limit} places used)`,
          disabled: !department.has_free_place,
        }))}
      />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={saving} loadingText="Moving…">
          Move
        </Button>
        <ModalClose asChild>
          <Button variant="secondary">Cancel</Button>
        </ModalClose>
      </div>
    </form>
  )
}
