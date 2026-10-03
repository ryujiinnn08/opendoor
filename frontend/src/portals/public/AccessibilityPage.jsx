import InfoPage from './InfoPage.jsx'

const SECTIONS = [
  {
    heading: 'Our goal',
    paragraphs: [
      'OpenDoor aims to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA. We test pages with automated tools, with the keyboard only, and with the NVDA screen reader.',
    ],
  },
  {
    heading: 'What you can expect',
    items: [
      'Every function works with a keyboard alone, with a visible focus outline and a "Skip to main content" link.',
      'Every form field has a visible label, and errors are explained in plain language and read out by screen readers.',
      'Text has strong contrast, and status is shown with text or icons, not color alone.',
      'Pages work when zoomed to 200% and on small phone screens.',
      'You are not logged out while filling in a form.',
    ],
  },
  {
    heading: 'Report a problem',
    paragraphs: [
      'If something on OpenDoor is hard to use with your assistive technology, please tell the OpenDoor team. Describe the page and what happened, and we will work on a fix.',
    ],
  },
]

export default function AccessibilityPage() {
  return (
    <InfoPage
      title="Accessibility statement"
      intro="OpenDoor is built for persons with disabilities, so accessibility is a requirement, not an extra."
      sections={SECTIONS}
      draft
    />
  )
}
