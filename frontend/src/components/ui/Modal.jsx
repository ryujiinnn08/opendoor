import * as Dialog from '@radix-ui/react-dialog'
import { useRef } from 'react'

/**
 * Accessible dialog (Radix): traps focus and closes with Escape. On close, focus returns
 * to the element that was focused when it opened (e.g., the button that opened it).
 *
 * initialFocusRef: element to focus first, e.g., Cancel in a destructive confirmation.
 * onCloseAutoFocus: call event.preventDefault() to move focus somewhere else yourself.
 */
export default function Modal({ open, onOpenChange, title, description, children, initialFocusRef, onCloseAutoFocus }) {
  const returnFocus = useRef(null)

  function handleOpenAutoFocus(event) {
    // Radix fires this before moving focus, so activeElement is still the opener.
    returnFocus.current = document.activeElement
    if (initialFocusRef?.current) {
      event.preventDefault()
      initialFocusRef.current.focus()
    }
  }

  function handleCloseAutoFocus(event) {
    onCloseAutoFocus?.(event)
    if (event.defaultPrevented) return
    const opener = returnFocus.current
    if (opener && document.contains(opener)) {
      event.preventDefault()
      opener.focus()
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content
          onOpenAutoFocus={handleOpenAutoFocus}
          onCloseAutoFocus={handleCloseAutoFocus}
          // Without a description, tell Radix not to expect one.
          {...(description ? {} : { 'aria-describedby': undefined })}
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border-2 border-border bg-surface p-6 text-text shadow-xl"
        >
          <Dialog.Title className="text-2xl font-bold">{title}</Dialog.Title>
          {description && <Dialog.Description className="mt-2">{description}</Dialog.Description>}
          <div className="mt-6">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export const ModalClose = Dialog.Close
