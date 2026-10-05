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
import VerificationSection from './VerificationSection.jsx'

function Section({ id, title, children }) {
  return (
    <section aria-labelledby={id} className="mt-8 rounded-lg border border-border bg-surface p-5 sm:p-6">
      <h2 id={id} className="text-2xl font-bold">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/**
 * Company profile for the owner: details, logo and verification. Individual employers use
 * IndividualProfilePage instead.
 */
export default function CompanyPage() {
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
      <PageHeading>Company profile</PageHeading>
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
          <Section id="details-heading" title="Company details">
            <EmployerProfileForm employer={employer} onSaved={saved('Company details saved.')} />
          </Section>
          <Section id="logo-heading" title="Logo">
            <LogoSection employer={employer} label="Company logo" onChange={saved('Logo updated.')} />
          </Section>
          <Section id="verification-heading" title="Verification">
            <VerificationSection
              employer={employer}
              onSaved={saved('Registration number submitted. An OpenDoor admin will check it.')}
            />
          </Section>
        </>
      )}
    </>
  )
}
