import { useEffect, useState } from 'react'
import { generalErrorFrom } from '../../api/client.js'
import { getEmployerProfile } from '../../api/employer.js'
import { useAuth } from '../../auth/authContext.js'
import LoadingMessage from '../../components/ui/LoadingMessage.jsx'
import Notice from '../../components/ui/Notice.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'
import { useAnnounce } from '../../components/ui/announcerContext.js'
import EmployerProfileForm from './EmployerProfileForm.jsx'
import LogoSection from './LogoSection.jsx'

export default function IndividualProfilePage() {
  const { refresh } = useAuth()
  const announce = useAnnounce()
  const [employer, setEmployer] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    getEmployerProfile()
      .then(setEmployer)
      .catch((error) => setLoadError(generalErrorFrom(error)))
  }, [])

  function saved(text) {
    return (updated) => {
      setEmployer(updated)
      setMessage(text)
      announce(text)
      refresh()
    }
  }

  return (
    <>
      <PageHeading>My employer profile</PageHeading>
      <p className="mt-4 max-w-prose">Job seekers see this on your job postings, marked as an individual employer.</p>
      {loadError && (
        <Notice tone="error" className="mt-6">
          {loadError}
        </Notice>
      )}
      {!employer && !loadError && <LoadingMessage />}
      {message && (
        <Notice tone="success" className="mt-6">
          {message}
        </Notice>
      )}

      {employer && (
        <>
          <section aria-labelledby="details-heading" className="mt-8 rounded-lg border border-border bg-surface p-5 sm:p-6">
            <h2 id="details-heading" className="text-2xl font-bold">
              Details
            </h2>
            <div className="mt-4">
              <EmployerProfileForm employer={employer} onSaved={saved('Profile saved.')} />
            </div>
          </section>
          <section aria-labelledby="logo-heading" className="mt-8 rounded-lg border border-border bg-surface p-5 sm:p-6">
            <h2 id="logo-heading" className="text-2xl font-bold">
              Photo or logo
            </h2>
            <div className="mt-4">
              <LogoSection employer={employer} label="Photo or logo" onChange={saved('Image updated.')} />
            </div>
          </section>
        </>
      )}
    </>
  )
}
