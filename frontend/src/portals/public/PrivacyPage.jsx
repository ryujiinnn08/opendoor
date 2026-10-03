import InfoPage from './InfoPage.jsx'

const SECTIONS = [
  {
    heading: 'What we collect',
    items: [
      'Account details: your name, email address and password (stored scrambled, never as plain text).',
      'For job seekers: your profile, skills, experience, location and the workplace accommodations you need.',
      'Your disability type only if you choose to add it. It is optional, hidden by default and never used to rank jobs.',
      'For employers: company details and business registration number.',
      'Applications, their status, and feedback about accommodations after you are hired.',
      'The date and time you agreed to this notice.',
    ],
  },
  {
    heading: 'Why we collect it',
    items: [
      'To match job seekers with jobs that provide the accommodations they need.',
      'To let employers review applications sent to their own job postings.',
      'To show an anonymous accommodation trust score for each employer.',
      'To keep the platform safe, for example by verifying employers.',
    ],
  },
  {
    heading: 'Who can see it',
    items: [
      'Employers see your profile and accommodation needs only after you apply to one of their job postings.',
      'Employers never see who gave feedback. They see combined results only, and only after at least three people have responded.',
      'OpenDoor administrators can see account details to verify employers and handle reports.',
      'We do not sell your information.',
    ],
  },
  {
    heading: 'Your rights',
    paragraphs: [
      'Under the Data Privacy Act of 2012 (Republic Act No. 10173), you can ask to see, correct or delete your information, and you can withdraw your consent. Contact the OpenDoor team to make a request.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy notice"
      intro="This notice explains what information OpenDoor collects, why, and who can see it."
      sections={SECTIONS}
      draft
    />
  )
}
