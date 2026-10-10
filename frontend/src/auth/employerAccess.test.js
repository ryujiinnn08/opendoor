import { describe, expect, it } from 'vitest'
import { employerKind, employerSummary } from './employerAccess.js'

const company = { id: 1, type: 'company', name: 'Acme Corp.' }

describe('employerKind', () => {
  it('tells owner, HR officer, individual and not-set-up employers apart', () => {
    expect(employerKind({ role: 'employer', membership: { role: 'owner', employer: company } })).toBe('owner')
    expect(employerKind({ role: 'employer', membership: { role: 'hr', employer: company, department: { name: 'IT' } } })).toBe('hr')
    expect(employerKind({ role: 'employer', membership: { role: 'owner', employer: { type: 'individual' } } })).toBe('individual')
    expect(employerKind({ role: 'employer', membership: null })).toBe('none')
    expect(employerKind({ role: 'candidate' })).toBeNull()
  })
})

describe('employerSummary', () => {
  it('describes who the employer is hiring for', () => {
    expect(employerSummary({ role: 'employer', membership: { role: 'owner', employer: company } })).toBe('Owner, Acme Corp.')
    expect(
      employerSummary({ role: 'employer', membership: { role: 'hr', employer: company, department: { name: 'IT' } } }),
    ).toBe('HR officer in IT, Acme Corp.')
    expect(employerSummary({ role: 'admin' })).toBeNull()
  })
})
