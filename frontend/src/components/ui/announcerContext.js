import { createContext, useContext } from 'react'

export const AnnouncerContext = createContext(() => {})

/** Returns announce(text): reads text out to screen-reader users without moving focus. */
export function useAnnounce() {
  return useContext(AnnouncerContext)
}
