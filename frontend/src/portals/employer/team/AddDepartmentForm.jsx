import { useState } from 'react'
import { fieldErrorsFrom, generalErrorFrom } from '../../../api/client.js'
import Button from '../../../components/ui/Button.jsx'
import FormField from '../../../components/ui/FormField.jsx'

export default function AddDepartmentForm({ cap, defaultLimit, onAdd }) {
  const [name, setName] = useState('')
  const [limit, setLimit] = useState(String(defaultLimit))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return

    const clientErrors = {}
    if (!name.trim()) clientErrors.name = 'Enter a department name.'
    const parsed = Number(limit)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > cap)
      clientErrors.member_limit = `Enter a whole number from 1 to ${cap}.`
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      document.getElementById(clientErrors.name ? 'new-department-name' : 'new-department-limit')?.focus()
      return
    }

    setSaving(true)
    try {
      await onAdd({ name: name.trim(), member_limit: parsed })
      setName('')
      setLimit(String(defaultLimit))
      setErrors({})
    } catch (error) {
      const fieldErrors = fieldErrorsFrom(error)
      setErrors(Object.keys(fieldErrors).length ? fieldErrors : { name: generalErrorFrom(error) })
      document.getElementById(fieldErrors.member_limit ? 'new-department-limit' : 'new-department-name')?.focus()
    } finally {
      setSaving(false)
    }
  }

  return (
    <section aria-labelledby="add-department-heading" className="mt-8 rounded-lg border border-border bg-surface p-5">
      <h2 id="add-department-heading" className="text-xl font-bold">
        Add a department
      </h2>
      <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-wrap items-end gap-x-4">
        <FormField
          id="new-department-name"
          label="Department name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          maxLength={100}
          className="w-full sm:w-auto sm:min-w-72"
        />
        <FormField
          id="new-department-limit"
          label="HR officer limit"
          hint={`1 to ${cap}`}
          type="number"
          inputMode="numeric"
          min={1}
          max={cap}
          value={limit}
          onChange={(event) => setLimit(event.target.value)}
          error={errors.member_limit}
          inputClassName="w-28"
        />
        <Button type="submit" loading={saving} loadingText="Adding…" className="mb-6">
          Add department
        </Button>
      </form>
    </section>
  )
}
