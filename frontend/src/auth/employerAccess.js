/**
 * What kind of employer the user is, which decides menus and pages (plan PHASE_2 §4.2):
 * 'owner' (company owner), 'hr' (HR officer), 'individual', 'none' (no employer profile
 * yet), or null for users who are not employers.
 */
export function employerKind(user) {
  if (user?.role !== 'employer') return null
  const membership = user.membership
  if (!membership) return 'none'
  if (membership.employer.type === 'individual') return 'individual'
  return membership.role
}

/** One line describing who the employer is hiring for, shown under their name. */
export function employerSummary(user) {
  const membership = user?.membership
  switch (employerKind(user)) {
    case 'owner':
      return `Owner, ${membership.employer.name}`
    case 'hr':
      return `HR officer, ${membership.department?.name} · ${membership.employer.name}`
    case 'individual':
      return 'Individual employer'
    case 'none':
      return 'Employer profile not set up yet'
    default:
      return null
  }
}
