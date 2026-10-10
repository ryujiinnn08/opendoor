/**
 * One open posting in the API's JobPostingResource shape, shared by component and page tests.
 */
export const postingFixture = {
  id: 2,
  title: 'Junior Web Developer',
  description: 'Build and maintain accessible web pages for our clients.\nA senior developer reviews your work every week.',
  location: 'Anywhere in the Philippines',
  employment_type: 'full_time',
  work_setup: 'remote',
  interview_format: 'online',
  closes_on: '2026-11-30',
  status: 'open',
  closed_automatically: false,
  rejection_reason: null,
  changed_after_approval: false,
  submitted_at: '2026-10-03T02:00:00+00:00',
  approved_at: '2026-10-04T02:00:00+00:00',
  updated_at: '2026-10-04T02:00:00+00:00',
  category: { id: 1, name: 'Information Technology' },
  department: { id: 5, name: 'IT' },
  employer: {
    id: 1,
    type: 'company',
    name: 'Acme Corp.',
    logo_url: null,
    is_verified: true,
    verification_status: 'verified',
  },
  created_by: { name: 'Ana Santos' },
  accommodations: [
    {
      id: 10,
      name: 'Remote work',
      group_name: 'Work arrangement',
      note: 'Laptop and internet allowance provided.',
      is_active: true,
    },
  ],
  actions: ['edit', 'close', 'change_closing_date', 'delete'],
}

export default postingFixture
