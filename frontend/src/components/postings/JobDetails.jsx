import { formatDay } from '../../lib/format.js'
import { EMPLOYMENT_TYPES, INTERVIEW_FORMATS, optionLabel, WORK_SETUPS } from '../../lib/postingOptions.js'
import Icon from '../ui/Icon.jsx'
import VerificationBadge from '../ui/VerificationBadge.jsx'
import AccommodationGroupIcon from './AccommodationGroupIcon.jsx'

/** Consecutive accommodations of the same group, in the order the API sorted them. */
function byGroup(accommodations) {
  const groups = []
  for (const item of accommodations) {
    const last = groups.at(-1)
    if (last?.group === item.group_name) last.items.push(item)
    else groups.push({ group: item.group_name, items: [item] })
  }
  return groups
}

function Detail({ label, children }) {
  return (
    <>
      <dt className="font-bold">{label}</dt>
      <dd>{children || <span className="text-muted">Not added yet</span>}</dd>
    </>
  )
}

/**
 * A posting as job seekers will see it (plan PHASE_2 §4.10), used by the Preview, the admin
 * Review and Phase 3's public job page. Accommodations come first, before the description.
 * The page around it supplies the title (h1) and the status. `markRetired` labels retired
 * accommodation types for admins (decision 31); job seekers still see them as provided.
 */
export default function JobDetails({ posting, showVerificationStatus = false, markRetired = false }) {
  const { employer } = posting
  const company = employer.type === 'company'
  const groups = byGroup(posting.accommodations ?? [])
  const ids = {
    accommodations: `posting-${posting.id}-accommodations`,
    glance: `posting-${posting.id}-glance`,
    about: `posting-${posting.id}-about`,
  }

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {employer.logo_url && (
          <img src={employer.logo_url} alt="" className="size-12 rounded-md border border-border bg-surface object-contain" />
        )}
        <p className="text-lg font-bold">{employer.name}</p>
        {company && (showVerificationStatus || employer.is_verified) && (
          <VerificationBadge status={employer.verification_status} />
        )}
        {!company && <p className="text-muted">Individual employer</p>}
      </div>
      {posting.department && <p className="mt-1">Department: {posting.department.name}</p>}

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-10 lg:col-start-2 lg:row-start-1">
          <section aria-labelledby={ids.accommodations} className="border-l-4 border-accent pl-5">
            <h2 id={ids.accommodations} className="text-2xl font-bold">
              Accommodations provided
            </h2>
            {groups.length === 0 ? (
              <p className="mt-3 text-muted">No accommodations added yet.</p>
            ) : (
              <div className="mt-4 space-y-5">
                {groups.map((group) => (
                  <div key={group.group}>
                    <h3 className="flex items-center gap-2 text-lg font-bold text-accent">
                      <AccommodationGroupIcon group={group.group} />
                      {group.group}
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {group.items.map((item) => (
                        <li key={item.id} className="flex gap-2">
                          <Icon name="check" className="mt-1 size-5 text-accent" />
                          <span>
                            <span className="font-bold">
                              {markRetired && item.is_active === false ? `${item.name} (no longer offered)` : item.name}
                            </span>
                            {item.note && <span className="block text-muted">{item.note}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby={ids.glance}>
            <h2 id={ids.glance} className="text-2xl font-bold">
              At a glance
            </h2>
            <dl className="mt-3 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-2">
              <Detail label="Work setup">{optionLabel(WORK_SETUPS, posting.work_setup)}</Detail>
              <Detail label="Employment type">{optionLabel(EMPLOYMENT_TYPES, posting.employment_type)}</Detail>
              <Detail label="Location">{posting.location}</Detail>
              <Detail label="Interview">{optionLabel(INTERVIEW_FORMATS, posting.interview_format)}</Detail>
              <Detail label="Apply by">{formatDay(posting.closes_on)}</Detail>
              <Detail label="Category">{posting.category?.name}</Detail>
            </dl>
          </section>
        </div>

        <section aria-labelledby={ids.about} className="lg:col-start-1 lg:row-start-1">
          <h2 id={ids.about} className="text-2xl font-bold">
            About the job
          </h2>
          {posting.description ? (
            <p className="mt-3 max-w-prose whitespace-pre-line">{posting.description}</p>
          ) : (
            <p className="mt-3 text-muted">Not added yet</p>
          )}
        </section>
      </div>
    </div>
  )
}
