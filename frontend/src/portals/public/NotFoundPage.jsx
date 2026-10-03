import { Link } from 'react-router-dom'
import PageHeading from '../../components/ui/PageHeading.jsx'

export default function NotFoundPage() {
  return (
    <>
      <PageHeading>Page not found</PageHeading>
      <p className="mt-4">The page you are looking for does not exist or has moved.</p>
      <p className="mt-4">
        <Link to="/" className="font-bold text-primary underline underline-offset-4 hover:no-underline">
          Go to the home page
        </Link>
      </p>
    </>
  )
}
