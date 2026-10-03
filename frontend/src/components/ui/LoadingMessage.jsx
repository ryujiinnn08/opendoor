export default function LoadingMessage({ children = 'Loading…' }) {
  return (
    <p role="status" className="px-4 py-8 text-center text-muted">
      {children}
    </p>
  )
}
