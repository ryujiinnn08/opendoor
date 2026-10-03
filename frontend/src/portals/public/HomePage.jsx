import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/authContext.js'
import { dashboardFor } from '../../auth/redirects.js'
import Notice from '../../components/ui/Notice.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'

const primaryLink =
  'inline-flex min-h-11 items-center rounded-md bg-primary px-5 py-2 font-bold text-on-primary hover:bg-primary-hover'
const secondaryLink =
  'inline-flex min-h-11 items-center rounded-md border-2 border-primary bg-surface px-5 py-2 font-bold text-primary hover:bg-bg'

const STEPS = [
  {
    title: 'Tell us what you need, once',
    text: 'Choose the workplace accommodations you need, such as a wheelchair-accessible entrance, a sign language interpreter or remote work.',
  },
  {
    title: 'See jobs that meet your needs',
    text: 'Job postings list the accommodations they provide, so you can see how many of your needs each job meets before you apply.',
  },
  {
    title: 'Know which employers keep their word',
    text: 'People who were hired confirm whether each promised accommodation was delivered. Their answers stay anonymous.',
  },
]

export default function HomePage() {
  const { status, role } = useAuth()
  const location = useLocation()

  return (
    <>
      {location.state?.loggedOut && (
        <Notice tone="success" className="mb-8">
          You have logged out.
        </Notice>
      )}

      <section>
        <PageHeading>Find jobs that meet your accommodation needs</PageHeading>
        <p className="mt-4 max-w-prose text-lg">
          OpenDoor is a job platform for persons with disabilities in the Philippines. Tell us what you need once, and
          see which openings provide it.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {status === 'authenticated' ? (
            <Link to={dashboardFor(role)} className={primaryLink}>
              Go to my dashboard
            </Link>
          ) : (
            <>
              <Link to="/register?type=candidate" className={primaryLink}>
                Register as a job seeker
              </Link>
              <Link to="/register?type=employer" className={secondaryLink}>
                Register as an employer
              </Link>
            </>
          )}
        </div>
        {status !== 'authenticated' && (
          <p className="mt-4">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-primary underline underline-offset-4 hover:no-underline">
              Log in
            </Link>
          </p>
        )}
      </section>

      <section aria-labelledby="how-it-works" className="mt-12">
        <h2 id="how-it-works" className="text-2xl font-bold">
          How OpenDoor works
        </h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-lg border border-border bg-surface p-5">
              <p className="font-bold text-accent">Step {index + 1}</p>
              <h3 className="mt-1 text-xl font-bold">{step.title}</h3>
              <p className="mt-2">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
