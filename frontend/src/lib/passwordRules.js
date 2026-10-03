// Mirrors the server rule: Password::min(8)->mixedCase()->numbers()->symbols().
export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (value) => [...value].length >= 8 },
  { id: 'upper', label: 'An uppercase letter (A-Z)', test: (value) => /\p{Lu}/u.test(value) },
  { id: 'lower', label: 'A lowercase letter (a-z)', test: (value) => /\p{Ll}/u.test(value) },
  { id: 'number', label: 'A number (0-9)', test: (value) => /\p{N}/u.test(value) },
  { id: 'symbol', label: 'A special character, such as ! or @', test: (value) => /[\p{Z}\p{S}\p{P}]/u.test(value) },
]

export function checkPassword(value) {
  return PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(value ?? '') }))
}

export function passwordMeetsRules(value) {
  return checkPassword(value).every((rule) => rule.met)
}
