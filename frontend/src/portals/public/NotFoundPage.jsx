import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section>
      <h1 tabIndex={-1} className="text-3xl font-bold">
        Page not found
      </h1>
      <p className="mt-4">
        <Link to="/" className="text-primary underline">
          Go to the home page
        </Link>
      </p>
    </section>
  )
}
