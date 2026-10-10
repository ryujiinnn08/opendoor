import { describe, expect, it } from 'vitest'
import {
  emptyValues,
  mergeRetired,
  payloadFrom,
  pickerErrors,
  savedMessage,
  summaryItems,
  validatePosting,
  valuesFrom,
} from './postingForm.js'

const range = { min: '2026-10-06', max: '2027-04-05' }

const completeValues = {
  ...emptyValues(),
  title: 'Junior Web Developer',
  category_id: '1',
  description: 'Build accessible web pages.',
  location: 'Anywhere in the Philippines',
  work_setup: 'remote',
  employment_type: 'full_time',
  interview_format: 'online',
  closes_on: '2026-11-30',
  accommodations: [{ id: 10, note: '' }],
}

describe('validatePosting', () => {
  it('needs only a title for a draft, plus a department for company owners', () => {
    expect(validatePosting(emptyValues(), { submitting: false, needsDepartment: false, range })).toEqual({
      title: 'Enter a job title.',
    })
    expect(validatePosting({ ...emptyValues(), title: 'Clerk' }, { submitting: false, needsDepartment: true, range })).toEqual({
      department_id: 'Choose the department this job is in.',
    })
  })

  it('needs every field and an accommodation to submit', () => {
    const errors = validatePosting({ ...emptyValues(), title: 'Clerk' }, { submitting: true, needsDepartment: false, range })

    expect(Object.keys(errors)).toEqual([
      'category_id',
      'description',
      'location',
      'work_setup',
      'employment_type',
      'interview_format',
      'accommodations',
      'closes_on',
    ])
    expect(errors.accommodations).toBe('Choose at least one accommodation your workplace provides.')
  })

  it('explains the allowed closing dates when submitting, but not for drafts', () => {
    const values = { ...completeValues, closes_on: '2027-05-01' }

    expect(validatePosting(values, { submitting: true, needsDepartment: false, range }).closes_on).toBe(
      'Choose a closing date between October 6, 2026 and April 5, 2027.',
    )
    expect(validatePosting(values, { submitting: false, needsDepartment: false, range })).toEqual({})
  })

  it('refuses a closing date with a five-digit year', () => {
    const values = { ...completeValues, closes_on: '20261-01-01' }

    expect(validatePosting(values, { submitting: true, needsDepartment: false, range }).closes_on).toBe(
      'Choose a closing date between October 6, 2026 and April 5, 2027.',
    )
  })
})

describe('payloadFrom', () => {
  it('sends numbers, nulls and trimmed notes', () => {
    const body = payloadFrom(
      {
        ...emptyValues(),
        title: 'Clerk',
        category_id: '3',
        accommodations: [
          { id: 7, note: '  Ramp  ' },
          { id: 8, note: '   ' },
        ],
      },
      { submit: false, needsDepartment: false },
    )

    expect(body).toMatchObject({
      title: 'Clerk',
      category_id: 3,
      location: null,
      closes_on: null,
      submit: false,
      accommodations: [
        { id: 7, note: 'Ramp' },
        { id: 8, note: null },
      ],
    })
    expect(body).not.toHaveProperty('department_id')
  })

  it('includes the department for company owners', () => {
    expect(payloadFrom({ ...completeValues, department_id: '5' }, { submit: true, needsDepartment: true })).toMatchObject({
      department_id: 5,
      submit: true,
    })
  })
})

describe('summaryItems and pickerErrors', () => {
  it('orders errors like the form and links each to its field', () => {
    const values = { ...completeValues, accommodations: [{ id: 10, note: '' }] }
    const errors = {
      closes_on: 'Choose a closing date.',
      'accommodations.0.note': 'Use 255 characters or fewer for each note.',
      work_setup: 'Choose the work setup.',
      title: 'Enter a job title.',
    }

    expect(summaryItems(errors, values, null)).toEqual([
      { id: 'title', message: 'Enter a job title.' },
      { id: 'work_setup-on_site', message: 'Choose the work setup.' },
      { id: 'accommodation-10-note', message: 'Use 255 characters or fewer for each note.' },
      { id: 'closes_on', message: 'Choose a closing date.' },
    ])
    expect(pickerErrors(errors, values)).toEqual({
      error: undefined,
      noteErrors: { 10: 'Use 255 characters or fewer for each note.' },
    })
  })

  it('shows a refused accommodation on the picker', () => {
    const values = { ...completeValues, accommodations: [{ id: 3, note: '' }] }

    expect(pickerErrors({ 'accommodations.0.id': '"Accessible parking" is no longer offered.' }, values).error).toBe(
      '"Accessible parking" is no longer offered.',
    )
  })
})

describe('valuesFrom and mergeRetired', () => {
  const posting = {
    title: 'Clerk',
    department: { id: 5, name: 'IT' },
    category: null,
    description: null,
    location: 'Makati City',
    work_setup: 'on_site',
    employment_type: null,
    interview_format: null,
    closes_on: null,
    accommodations: [
      { id: 1, name: 'Remote work', group_name: 'Work arrangement', note: null, is_active: true },
      { id: 3, name: 'Accessible parking', group_name: 'Physical access', note: 'Slot 4', is_active: false },
    ],
  }

  it('turns a posting into form values', () => {
    expect(valuesFrom(posting)).toMatchObject({
      title: 'Clerk',
      department_id: '5',
      category_id: '',
      description: '',
      accommodations: [
        { id: 1, note: '' },
        { id: 3, note: 'Slot 4' },
      ],
    })
  })

  it('adds retired accommodations already on the posting to their group', () => {
    const groups = [{ group: 'Work arrangement', accommodations: [{ id: 1, name: 'Remote work', is_active: true }] }]

    expect(mergeRetired(groups, posting.accommodations)).toEqual([
      { group: 'Work arrangement', accommodations: [{ id: 1, name: 'Remote work', is_active: true }] },
      { group: 'Physical access', accommodations: [{ id: 3, name: 'Accessible parking', description: null, is_active: false }] },
    ])
  })
})

describe('savedMessage', () => {
  it('says what happened to the posting', () => {
    expect(savedMessage({ before: null, saved: { title: 'Clerk', status: 'draft' } })).toBe('"Clerk" was saved as a draft.')
    expect(savedMessage({ before: null, saved: { title: 'Clerk', status: 'pending' } })).toBe(
      '"Clerk" was sent for approval. An OpenDoor admin will review it.',
    )
    expect(savedMessage({ before: 'rejected', saved: { title: 'Clerk', status: 'rejected' } })).toBe(
      'Changes to "Clerk" were saved. It stays rejected until you resubmit it.',
    )
    expect(savedMessage({ before: 'open', saved: { title: 'Clerk', status: 'pending' } })).toBe(
      '"Clerk" was sent for approval again. Job seekers won\'t see it until it is approved.',
    )
  })
})
