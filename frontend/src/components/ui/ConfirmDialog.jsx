import { useRef } from 'react'
import Button from './Button.jsx'
import Modal, { ModalClose } from './Modal.jsx'

/**
 * "Are you sure?" dialog. Focus starts on Cancel, so pressing Enter by accident never
 * confirms a destructive action.
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant = 'danger',
  onConfirm,
  busy = false,
  error,
  onCloseAutoFocus,
}) {
  const cancelRef = useRef(null)

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      initialFocusRef={cancelRef}
      onCloseAutoFocus={onCloseAutoFocus}
    >
      {error && (
        <p className="mb-4 font-bold text-danger" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button variant={confirmVariant} onClick={onConfirm} loading={busy} loadingText="Working…">
          {confirmLabel}
        </Button>
        <ModalClose asChild>
          <Button ref={cancelRef} variant="secondary">
            Cancel
          </Button>
        </ModalClose>
      </div>
    </Modal>
  )
}
