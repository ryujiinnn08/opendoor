import Icon from '../ui/Icon.jsx'

// One simple icon per accommodation group (concept plan §4), always shown with the group's name.
const ICONS = {
  'Physical access': 'door',
  Communication: 'chat',
  'Work arrangement': 'calendar',
  'Assistive technology': 'monitor',
  Support: 'people',
}

export default function AccommodationGroupIcon({ group, className = 'size-5' }) {
  return <Icon name={ICONS[group] ?? 'dot'} className={className} />
}
