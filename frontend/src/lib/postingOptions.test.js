import { describe, expect, it } from 'vitest'
import { formatDay } from './format.js'
import { closingDateRange, optionLabel, WORK_SETUPS } from './postingOptions.js'

describe('closingDateRange', () => {
  it('uses Manila dates for the closing date range', () => {
    expect(closingDateRange(new Date('2026-10-05T02:00:00Z'))).toEqual({ min: '2026-10-06', max: '2027-04-05' })
    expect(closingDateRange(new Date('2026-10-05T16:30:00Z'))).toEqual({ min: '2026-10-07', max: '2027-04-06' })
  })

  it('clamps six months to the end of a shorter month', () => {
    expect(closingDateRange(new Date('2026-08-31T02:00:00Z')).max).toBe('2027-02-28')
  })

  it('rolls tomorrow over the end of the year', () => {
    expect(closingDateRange(new Date('2026-12-31T02:00:00Z')).min).toBe('2027-01-01')
  })
})

describe('formatDay', () => {
  it('formats date-only values without shifting the day', () => {
    expect(formatDay('2026-11-30')).toBe('November 30, 2026')
  })
})

describe('optionLabel', () => {
  it('names a value, and stays empty for unknown ones', () => {
    expect(optionLabel(WORK_SETUPS, 'on_site')).toBe('On-site')
    expect(optionLabel(WORK_SETUPS, 'moon')).toBe('')
  })
})
