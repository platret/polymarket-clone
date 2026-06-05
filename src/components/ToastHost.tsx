import { useUI } from '../store/useUI'
import clsx from 'clsx'

export function ToastHost() {
  const toasts = useUI((s) => s.toasts)
  const dismiss = useUI((s) => s.dismissToast)
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-[min(92vw,360px)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={clsx(
            'card shadow-pop p-3.5 pr-4 cursor-pointer animate-fade-in border-l-4',
            t.kind === 'success' && 'border-l-yes',
            t.kind === 'error' && 'border-l-no',
            t.kind === 'info' && 'border-l-brand',
          )}
        >
          <div className="font-bold text-sm">{t.title}</div>
          {t.detail && <div className="text-xs text-text-muted mt-0.5">{t.detail}</div>}
        </div>
      ))}
    </div>
  )
}
