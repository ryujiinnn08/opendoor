import { formatDay } from '../../../lib/format.js'
import { inClosingDateRange } from '../../../lib/postingOptions.js'

// The job posting form's fields, in the order they appear (and errors are listed).
export const FORM_FIELDS = [
  'title',
  'department_id',
  'category_id',
  'description',
  'location',
  'work_setup',
  'employment_type',
  'interview_format',
  'accommodations',
  'closes_on',
]

// Same wording as the server (JobPostingRequest), so both kinds of error read alike.
const MESSAGES = {
  title: 'Enter a job title.',
  department_id: 'Choose the department this job is in.',
  category_id: 'Choose a category.',
  description: 'Describe the job.',
  location: 'Enter where the job is, e.g., "Makati City" or "Anywhere in the Philippines".',
  work_setup: 'Choose the work setup.',
  employment_type: 'Choose the employment type.',
  interview_format: 'Choose how interviews are held.',
  accommodations: 'Choose at least one accommodation your workplace provides.',
  closes_on: 'Choose a closing date.',
}

const REQUIRED_TO_SUBMIT = ['category_id', 'description', 'location', 'work_setup', 'employment_type', 'interview_format']

// Error summary links go to the first radio button of a group.
const FIRST_RADIO = {
  work_setup: 'work_setup-on_site',
  employment_type: 'employment_type-full_time',
  interview_format: 'interview_format-online',
}

export function emptyValues({ location = '', departmentId = '' } = {}) {
  return {
    title: '',
    department_id: departmentId,
    category_id: '',
    description: '',
    location,
    work_setup: '',
    employment_type: '',
    interview_format: '',
    closes_on: '',
    accommodations: [],
  }
}

/** Form values (strings, '' when missing) from a posting in the API's shape. */
export function valuesFrom(posting) {
  return {
    title: posting.title ?? '',
    department_id: posting.department ? String(posting.department.id) : '',
    category_id: posting.category ? String(posting.category.id) : '',
    description: posting.description ?? '',
    location: posting.location ?? '',
    work_setup: posting.work_setup ?? '',
    employment_type: posting.employment_type ?? '',
    interview_format: posting.interview_format ?? '',
    closes_on: posting.closes_on ?? '',
    accommodations: posting.accommodations.map(({ id, note }) => ({ id, note: note ?? '' })),
  }
}

/**
 * Retired accommodations already on the posting stay pickable (decision 31): they are added
 * to their group, since the active list no longer has them.
 */
export function mergeRetired(groups, attached) {
  const known = new Set(groups.flatMap((group) => group.accommodations.map((item) => item.id)))
  const merged = groups.map((group) => ({ ...group, accommodations: [...group.accommodations] }))

  for (const item of attached) {
    if (item.is_active !== false || known.has(item.id)) continue
    let group = merged.find((candidate) => candidate.group === item.group_name)
    if (!group) {
      group = { group: item.group_name, accommodations: [] }
      merged.push(group)
    }
    group.accommodations.push({ id: item.id, name: item.name, description: null, is_active: false })
  }

  return merged
}

/**
 * A draft needs a title (and a department for company postings); submitting, or saving a
 * posting that is waiting, open or closed, needs every field (decisions 5, 24, 28 and 29).
 */
export function validatePosting(values, { submitting, needsDepartment, range }) {
  const errors = {}
  const blank = (key) => !String(values[key] ?? '').trim()

  if (blank('title')) errors.title = MESSAGES.title
  if (needsDepartment && !values.department_id) errors.department_id = MESSAGES.department_id

  if (submitting) {
    for (const key of REQUIRED_TO_SUBMIT) {
      if (blank(key)) errors[key] = MESSAGES[key]
    }
    if (values.accommodations.length === 0) errors.accommodations = MESSAGES.accommodations
    if (!values.closes_on) {
      errors.closes_on = MESSAGES.closes_on
    } else if (!inClosingDateRange(values.closes_on, range)) {
      errors.closes_on = `Choose a closing date between ${formatDay(range.min)} and ${formatDay(range.max)}.`
    }
  }

  return errors
}

function blankToNull(value) {
  return typeof value === 'string' && value.trim() === '' ? null : value
}

/** The API body: blank fields become null, ids become numbers, notes are trimmed. */
export function payloadFrom(values, { submit, needsDepartment }) {
  return {
    title: values.title.trim(),
    ...(needsDepartment ? { department_id: values.department_id ? Number(values.department_id) : null } : {}),
    category_id: values.category_id ? Number(values.category_id) : null,
    description: blankToNull(values.description),
    location: blankToNull(values.location),
    work_setup: blankToNull(values.work_setup),
    employment_type: blankToNull(values.employment_type),
    interview_format: blankToNull(values.interview_format),
    closes_on: blankToNull(values.closes_on),
    accommodations: values.accommodations.map(({ id, note }) => ({ id, note: note?.trim() ? note.trim() : null })),
    submit,
  }
}

/** The id of the element an error belongs to, for the error summary's links. */
export function fieldIdFor(key, values) {
  if (FIRST_RADIO[key]) return FIRST_RADIO[key]

  const match = key.match(/^accommodations\.(\d+)\.(id|note)$/)
  if (match) {
    const item = values.accommodations[Number(match[1])]
    if (!item) return 'accommodations'
    return match[2] === 'note' ? `accommodation-${item.id}-note` : `accommodation-${item.id}`
  }

  return key
}

/** Error summary items in the order of the form, each linked to its field. */
export function summaryItems(errors, values, generalError) {
  const rank = (key) => {
    const index = FORM_FIELDS.indexOf(key.split('.')[0])
    return index === -1 ? FORM_FIELDS.length : index
  }

  return [
    ...(generalError ? [{ message: generalError }] : []),
    ...Object.keys(errors)
      .sort((a, b) => rank(a) - rank(b))
      .map((key) => ({ id: fieldIdFor(key, values), message: errors[key] })),
  ]
}

/** The picker's own error and its per-note errors ({ [accommodation id]: message }). */
export function pickerErrors(errors, values) {
  const noteErrors = {}
  let itemError

  for (const [key, message] of Object.entries(errors)) {
    const match = key.match(/^accommodations\.(\d+)\.(id|note)$/)
    if (!match) continue
    const item = values.accommodations[Number(match[1])]
    if (match[2] === 'note' && item) noteErrors[item.id] = message
    if (match[2] === 'id') itemError ??= message
  }

  return { error: errors.accommodations ?? itemError, noteErrors }
}

/** What happened, shown on the Job postings page after saving. `before` is null for new postings. */
export function savedMessage({ before, saved }) {
  const title = `"${saved.title}"`

  if (before === 'open' || before === 'closed') {
    return `${title} was sent for approval again. Job seekers won't see it until it is approved.`
  }
  if (before === 'pending') return `Changes to ${title} were saved. It is still waiting for approval.`
  if (saved.status === 'pending') return `${title} was sent for approval. An OpenDoor admin will review it.`
  if (before === 'rejected') return `Changes to ${title} were saved. It stays rejected until you resubmit it.`
  if (before === 'draft') return `Changes to ${title} were saved.`
  return `${title} was saved as a draft.`
}
