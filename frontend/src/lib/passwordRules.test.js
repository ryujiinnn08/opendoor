import { describe, expect, it } from 'vitest'
import { checkPassword, passwordMeetsRules } from './passwordRules.js'

const unmet = (value) => checkPassword(value).filter((rule) => !rule.met).map((rule) => rule.id)

describe('password rules', () => {
  it('accepts a password that meets every rule', () => {
    expect(passwordMeetsRules('OpenDoor@2026')).toBe(true)
  })

  it('reports each missing requirement', () => {
    expect(unmet('Ab@1')).toEqual(['length'])
    expect(unmet('secure@123')).toEqual(['upper'])
    expect(unmet('SECURE@123')).toEqual(['lower'])
    expect(unmet('Secure@abc')).toEqual(['number'])
    expect(unmet('Secure1234')).toEqual(['symbol'])
    expect(unmet('')).toEqual(['length', 'upper', 'lower', 'number', 'symbol'])
  })
})
