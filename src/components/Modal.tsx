import { useEffect, type ReactNode } from 'react'

export function Modal({ open, onClose, title, children, wide = false }: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`relative card shadow-pop p-5 w-full animate-pop-in ${wide ? 'max-w-lg' : 'max-w-sm'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text w-8 h-8 grid place-items-center rounded-lg hover:bg-ink-700">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
