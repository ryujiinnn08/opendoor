export function inputClasses(hasError, extra = '') {
  return [
    'block w-full rounded-md border-2 bg-surface px-3 py-2 text-text',
    hasError ? 'border-danger' : 'border-muted',
    extra,
  ].join(' ')
}

export function describedBy(...ids) {
  const joined = ids.filter(Boolean).join(' ')
  return joined || undefined
}
