import { describe, expect, it } from 'vitest'
import { dashboardFor, safeNext } from './redirects.js'

describe('dashboardFor', () => {
  it('returns each role dashboard', () => {
    expect(dashboardFor('candidate')).toBe('/candidate/dashboard')
    expect(dashboardFor('employer')).toBe('/employer/dashboard')
    expect(dashboardFor('admin')).toBe('/admin/dashboard')
    expect(dashboardFor(undefined)).toBe('/')
  })
})

describe('safeNext', () => {
  it('accepts paths inside OpenDoor', () => {
    expect(safeNext('/admin/categories')).toBe('/admin/categories')
    expect(safeNext('/candidate/dashboard?tab=1')).toBe('/candidate/dashboard?tab=1')
  })

  it('rejects links to other sites', () => {
    expect(safeNext('https://evil.example')).toBeNull()
    expect(safeNext('//evil.example')).toBeNull()
    expect(safeNext('/\\evil.example')).toBeNull()
    expect(safeNext('javascript:alert(1)')).toBeNull()
    expect(safeNext(null)).toBeNull()
  })
})
