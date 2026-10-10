import { Link } from 'react-router-dom'

/**
 * The OpenDoor logo and name. The image is decorative (alt=""), because the name next to
 * it already says "OpenDoor". Replace public/opendoor-logo.svg to change the logo.
 */
export default function BrandLink({ to = '/' }) {
  return (
    <Link to={to} className="inline-flex min-h-11 items-center gap-2 text-2xl font-bold text-primary">
      <img src="/opendoor-logo.svg" alt="" width="32" height="32" className="size-8" />
      OpenDoor
    </Link>
  )
}
