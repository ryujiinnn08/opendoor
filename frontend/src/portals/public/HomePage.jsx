import { useEffect, useState } from 'react'
import { API_URL } from '../../api/client.js'
import { getHealth } from '../../api/health.js'

export default function HomePage() {
  const [health, setHealth] = useState({ state: 'loading' })

  useEffect(() => {
    getHealth()
      .then((data) => setHealth({ state: 'ok', data }))
      .catch(() => setHealth({ state: 'error' }))
  }, [])

  return (
    <section>
      <h1 tabIndex={-1} className="text-3xl font-bold sm:text-4xl">
        Find jobs that meet your accommodation needs
      </h1>
      <p className="mt-4 max-w-prose text-lg text-muted">
        Tell us what you need once. OpenDoor shows which openings provide it, and hired employees confirm whether
        employers kept their promises.
      </p>

      <div className="mt-8 rounded-lg border border-border bg-surface p-4" role="status" aria-live="polite">
        <h2 className="font-bold">System status</h2>
        {health.state === 'loading' && <p>Checking the API…</p>}
        {health.state === 'ok' && (
          <p>
            <span aria-hidden="true">✓ </span>API reachable. Database: {health.data.database}.
          </p>
        )}
        {health.state === 'error' && (
          <p className="text-danger">
            <span aria-hidden="true">✕ </span>API not reachable at {API_URL}.
          </p>
        )}
      </div>
    </section>
  )
}
