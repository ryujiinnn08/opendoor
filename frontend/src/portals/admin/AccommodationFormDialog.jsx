import { useState } from 'react'
import { fieldErrorsFrom, generalErrorFrom } from '../../api/client.js'
import { createAccommodation, updateAccommodation } from '../../api/masterData.js'
import Button from '../../components/ui/Button.jsx'
import FormField from '../../components/ui/FormField.jsx'
import Modal, { ModalClose } from '../../components/ui/Modal.jsx'

const FIELDS = ['name', 'group_name', 'description']

/**
 * Add or edit an accommodation type. `accommodation` null means "add".
 */
export default function AccommodationFormDialog({ open, onOpenChange, accommodation, groups, onSaved }) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={accommodation ? `Edit "${accommodation.name}"` : 'Add an accommodation type'}
    >
      {/* The dialog content unmounts when closed, so the form starts fresh each time it opens. */}
      <AccommodationForm key={accommodation?.id ?? 'new'} accommodation={accommodation} groups={groups} onSaved={onSaved} />
    </Modal>
  )
}

function AccommodationForm({ accommodation, groups, onSaved }) {
  const isEdit = Boolean(accommodation)
  const [values, setValues] = useState(() => ({
    name: accommodation?.name ?? '',
    group_name: accommodation?.group_name ?? '',
    description: accommodation?.description ?? '',
  }))
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState(null)
  const [saving, setSaving] = useState(false)

  function update(field) {
    return (event) => setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  function showErrors(fieldErrors) {
    setErrors(fieldErrors)
    const first = FIELDS.find((field) => fieldErrors[field])
    if (first) requestAnimationFrame(() => document.getElementById(`accommodation-${first}`)?.focus())
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return

    const clientErrors = {}
    if (!values.name.trim()) clientErrors.name = 'Enter a name for the accommodation type.'
    if (!values.group_name.trim()) clientErrors.group_name = 'Choose or enter a group.'
    if (Object.keys(clientErrors).length) return showErrors(clientErrors)

    setSaving(true)
    setGeneralError(null)
    try {
      const payload = { ...values, description: values.description.trim() || null }
      const saved = isEdit ? await updateAccommodation(accommodation.id, payload) : await createAccommodation(payload)
      onSaved(saved, isEdit)
    } catch (error) {
      showErrors(fieldErrorsFrom(error))
      setGeneralError(generalErrorFrom(error))
      setSaving(false)
    }
  }

  return (
    <>
      {generalError && (
        <p role="alert" className="mb-4 font-bold text-danger">
          {generalError}
        </p>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <FormField
          id="accommodation-name"
          label="Name"
          hint="Plain language, e.g., Wheelchair-accessible entrance."
          value={values.name}
          onChange={update('name')}
          error={errors.name}
          maxLength={150}
          inputClassName="w-full"
        />
        <FormField
          id="accommodation-group_name"
          label="Group"
          hint="Choose an existing group from the suggestions, or type a new one."
          list="accommodation-group-options"
          autoComplete="off"
          value={values.group_name}
          onChange={update('group_name')}
          error={errors.group_name}
          maxLength={50}
          inputClassName="w-full"
        />
        <datalist id="accommodation-group-options">
          {groups.map((group) => (
            <option key={group} value={group} />
          ))}
        </datalist>
        <FormField
          id="accommodation-description"
          as="textarea"
          rows={3}
          label="Description"
          hint="One sentence that explains it to job seekers and employers."
          optional
          value={values.description}
          onChange={update('description')}
          error={errors.description}
          maxLength={500}
          inputClassName="w-full"
        />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={saving} loadingText="Saving…">
            {isEdit ? 'Save changes' : 'Add accommodation type'}
          </Button>
          <ModalClose asChild>
            <Button variant="secondary">Cancel</Button>
          </ModalClose>
        </div>
      </form>
    </>
  )
}
