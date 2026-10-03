const VARIANTS = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover border-2 border-primary hover:border-primary-hover',
  secondary: 'bg-surface text-primary border-2 border-primary hover:bg-bg',
  danger: 'bg-danger text-white border-2 border-danger hover:opacity-90',
  link: 'text-primary underline underline-offset-4 hover:no-underline px-1',
}

/**
 * While `loading`, the button keeps focus and its label changes (e.g., "Saving…"), so
 * the state is never conveyed by a silently disabled button.
 */
export default function Button({
  variant = 'primary',
  type = 'button',
  loading = false,
  loadingText = 'Please wait…',
  className = '',
  children,
  onClick,
  ...props
}) {
  const sizing = variant === 'link' ? 'min-h-11' : 'min-h-11 px-5 py-2'

  return (
    <button
      type={type}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={(event) => {
        if (loading) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-bold ${sizing} ${VARIANTS[variant]} ${loading ? 'cursor-progress opacity-80' : ''} ${className}`}
      {...props}
    >
      {loading ? loadingText : children}
    </button>
  )
}
