// Menu items per portal. Pages from later phases are added here as they are built.
export const PORTALS = {
  candidate: {
    name: 'Candidate portal',
    menu: [{ to: '/candidate/dashboard', label: 'Dashboard' }],
  },
  employer: {
    name: 'Employer portal',
    menu: [{ to: '/employer/dashboard', label: 'Dashboard' }],
  },
  admin: {
    name: 'Admin portal',
    menu: [
      { to: '/admin/dashboard', label: 'Dashboard' },
      { to: '/admin/categories', label: 'Categories' },
      { to: '/admin/accommodations', label: 'Accommodation types' },
    ],
  },
}
