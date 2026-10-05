const dateFormat = new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })

/** "October 12, 2026" */
export function formatDate(iso) {
  return iso ? dateFormat.format(new Date(iso)) : ''
}

export const REGISTRATION_TYPES = [
  { value: 'dti', label: 'DTI', text: 'Department of Trade and Industry: sole proprietorships' },
  { value: 'sec', label: 'SEC', text: 'Securities and Exchange Commission: corporations and partnerships' },
  { value: 'cda', label: 'CDA', text: 'Cooperative Development Authority: cooperatives' },
]

export function registrationLabel(type) {
  return REGISTRATION_TYPES.find((item) => item.value === type)?.label ?? ''
}
