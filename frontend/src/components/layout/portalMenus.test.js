import { describe, expect, it } from 'vitest'
import { portalFor } from './portalMenus.js'

const labels = (user) => portalFor(user).menu.map((item) => item.label)
const company = { type: 'company', name: 'Acme Corp.' }

describe('portalFor', () => {
  it('gives each kind of employer its own menu', () => {
    expect(labels({ role: 'employer', membership: { role: 'owner', employer: company } })).toEqual([
      'Dashboard',
      'Company profile',
      'Team',
      'Job postings',
    ])
    expect(labels({ role: 'employer', membership: { role: 'hr', employer: company, department: { name: 'IT' } } })).toEqual([
      'Dashboard',
      'Job postings',
    ])
    expect(labels({ role: 'employer', membership: { role: 'owner', employer: { type: 'individual' } } })).toEqual([
      'Dashboard',
      'My profile',
      'Job postings',
    ])
    expect(labels({ role: 'employer', membership: null })).toEqual(['Set up your profile'])
  })

  it('includes the new admin pages', () => {
    expect(labels({ role: 'admin' })).toContain('Employer verification')
    expect(labels({ role: 'admin' })).toContain('Settings')
    expect(labels({ role: 'admin' })).toContain('Posting approvals')
  })
})
