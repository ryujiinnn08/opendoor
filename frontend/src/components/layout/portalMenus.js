import { employerKind } from '../../auth/employerAccess.js'

// Menu items per portal. Pages from later phases are added here as they are built.
const EMPLOYER_MENUS = {
  none: [{ to: '/employer/setup', label: 'Set up your profile' }],
  owner: [
    { to: '/employer/dashboard', label: 'Dashboard' },
    { to: '/employer/company', label: 'Company profile' },
    { to: '/employer/team', label: 'Team' },
  ],
  hr: [{ to: '/employer/dashboard', label: 'Dashboard' }],
  individual: [
    { to: '/employer/dashboard', label: 'Dashboard' },
    { to: '/employer/profile', label: 'My profile' },
  ],
}

const PORTALS = {
  candidate: {
    name: 'Candidate portal',
    menu: [{ to: '/candidate/dashboard', label: 'Dashboard' }],
  },
  admin: {
    name: 'Admin portal',
    menu: [
      { to: '/admin/dashboard', label: 'Dashboard' },
      { to: '/admin/categories', label: 'Categories' },
      { to: '/admin/accommodations', label: 'Accommodation types' },
      { to: '/admin/employers', label: 'Employer verification' },
      { to: '/admin/settings', label: 'Settings' },
    ],
  },
}

/** { name, menu } for the logged-in user's portal. */
export function portalFor(user) {
  if (user.role === 'employer') {
    return { name: 'Employer portal', menu: EMPLOYER_MENUS[employerKind(user)] }
  }
  return PORTALS[user.role]
}
