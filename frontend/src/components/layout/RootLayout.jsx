import { useEffect, useRef } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'

/**
 * Wraps every page. After each navigation (not the first page load), focus moves to the
 * new page's <h1> so screen-reader and keyboard users start at the top of the new content.
 */
export default function RootLayout() {
  const { pathname } = useLocation()
  const isFirstPage = useRef(true)

  useEffect(() => {
    if (isFirstPage.current) {
      isFirstPage.current = false
      return
    }
    const frame = requestAnimationFrame(() => document.querySelector('main h1')?.focus())
    return () => cancelAnimationFrame(frame)
  }, [pathname])

  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  )
}
