import { useEffect } from 'react'

/**
 * The page's <h1>. Focus moves here after navigation (see RootLayout), and it sets the
 * browser tab title so screen-reader users hear which page they are on.
 */
export default function PageHeading({ children, title, className = '' }) {
  const documentTitle = title ?? (typeof children === 'string' ? children : null)

  useEffect(() => {
    if (documentTitle) document.title = `${documentTitle} | OpenDoor`
  }, [documentTitle])

  return (
    <h1 tabIndex={-1} className={`text-title font-bold tracking-tight sm:text-title-lg ${className}`}>
      {children}
    </h1>
  )
}
