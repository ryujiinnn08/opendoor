import { useEffect, useState } from 'react'
import { getSettings, updateSettings } from '../../api/admin.js'
import { fieldErrorsFrom, generalErrorFrom } from '../../api/client.js'
import Button from '../../components/ui/Button.jsx'
import FormField from '../../components/ui/FormField.jsx'
import LoadingMessage from '../../components/ui/LoadingMessage.jsx'
import Notice from '../../components/ui/Notice.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'
import { useAnnounce } from '../../components/ui/announcerContext.js'

export default function SettingsPage() {
  const announce = useAnnounce()
  const [cap, setCap] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSettings()
      .then((settings) => setCap(String(settings.hr_per_department_cap)))
      .catch((loadFailure) => setLoadError(generalErrorFrom(loadFailure)))
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return

    const parsed = Number(cap)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
      setError('Enter a whole number from 1 to 100.')
      document.getElementById('hr-cap')?.focus()
      return
    }

    setSaving(true)
    try {
      const saved = await updateSettings({ hr_per_department_cap: parsed })
      setCap(String(saved.hr_per_department_cap))
      setError(null)
      const text = `Saved. Departments can now have up to ${saved.hr_per_department_cap} HR officers.`
      setMessage(text)
      announce(text)
    } catch (saveError) {
      setError(fieldErrorsFrom(saveError).hr_per_department_cap ?? generalErrorFrom(saveError))
      document.getElementById('hr-cap')?.focus()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeading>Settings</PageHeading>
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
      {cap === null && !loadError && <LoadingMessage />}
      {cap !== null && (
        <section aria-labelledby="teams-heading" className="mt-8 rounded-lg border border-border bg-surface p-5 sm:p-6">
          <h2 id="teams-heading" className="text-2xl font-bold">
            Company teams
          </h2>
          <form onSubmit={handleSubmit} noValidate className="mt-4">
            <FormField
              id="hr-cap"
              label="Maximum HR officers per department"
              hint="Company owners can set each department's limit up to this number. Lowering it never removes anyone: departments over the new maximum keep their HR officers but can't invite more until they are under it."
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              value={cap}
              onChange={(event) => setCap(event.target.value)}
              error={error}
              inputClassName="w-32"
            />
            <Button type="submit" loading={saving} loadingText="Saving…">
              Save settings
            </Button>
          </form>
        </section>
      )}
    </div>
  )
}
