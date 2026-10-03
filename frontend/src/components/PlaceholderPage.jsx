export default function PlaceholderPage({ title, children }) {
  return (
    <section>
      <h1 tabIndex={-1} className="text-3xl font-bold">
        {title}
      </h1>
      <p className="mt-4 text-muted">{children}</p>
    </section>
  )
}
