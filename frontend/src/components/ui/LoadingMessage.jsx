export default function LoadingMessage({ children = 'Loading…' }) {
  return (
    <p role="status" className="py-6 text-muted">
      {children}
    </p>
  )
}
