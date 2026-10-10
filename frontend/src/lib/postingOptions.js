// Choices on job postings (plan PHASE_2 decision 10); values match the API.

export const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
]

export const WORK_SETUPS = [
  { value: 'on_site', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote', label: 'Remote' },
]

export const INTERVIEW_FORMATS = [
  { value: 'online', label: 'Online' },
  { value: 'on_site', label: 'On-site' },
  { value: 'online_or_on_site', label: 'Online or on-site' },
]

/** The label for a stored value, or '' when it is missing or unknown. */
export function optionLabel(options, value) {
  return options.find((option) => option.value === value)?.label ?? ''
}

/** Filter links on the Job postings page; values match the API's `status` filter. */
export const POSTING_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'pending', label: 'Waiting' },
  { value: 'draft', label: 'Drafts' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'closed', label: 'Closed' },
]

const MAX_MONTHS_AHEAD = 6

const manilaParts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Manila',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
})

/** [year, month (1–12), day] of a moment in Philippine time. */
function manilaDate(now) {
  const parts = Object.fromEntries(manilaParts.formatToParts(now).map((part) => [part.type, part.value]))
  return [Number(parts.year), Number(parts.month), Number(parts.day)]
}

function isoDay(utcDate) {
  return utcDate.toISOString().slice(0, 10)
}

/** Today's date in Philippine time, 'YYYY-MM-DD'; closing dates are whole days there. */
export function manilaToday(now = new Date()) {
  const [year, month, day] = manilaDate(now)
  return isoDay(new Date(Date.UTC(year, month - 1, day)))
}

/**
 * The allowed closing dates: tomorrow to six months ahead, Philippine time (decisions 11 and 29).
 * Six months after August 31 is February 28, the same as the server's rule.
 */
export function closingDateRange(now = new Date()) {
  const [year, month, day] = manilaDate(now)
  const targetMonth = month - 1 + MAX_MONTHS_AHEAD
  const lastDayOfTarget = new Date(Date.UTC(year, targetMonth + 1, 0)).getUTCDate()

  return {
    min: isoDay(new Date(Date.UTC(year, month - 1, day + 1))),
    max: isoDay(new Date(Date.UTC(year, targetMonth, Math.min(day, lastDayOfTarget)))),
  }
}

/**
 * True when `day` ('YYYY-MM-DD') is inside the range. The dates are compared as text, so the
 * year must have four digits: date fields also accept years like 20261.
 */
export function inClosingDateRange(day, { min, max }) {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && day >= min && day <= max
}
