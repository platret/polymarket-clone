import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { useStore } from '../store/useStore'
import { ODDS_FORMATS } from '../lib/odds'
import type { OddsFormat } from '../types'

type SettingsMenuProps = {
  /** Show a text label next to the gear icon. */
  label?: boolean
}

export function SettingsMenu({ label = false }: SettingsMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const oddsFormat = useStore((s) => s.settings.oddsFormat)
  const botsEnabled = useStore((s) => s.settings.botsEnabled)
  const setOddsFormat = useStore((s) => s.setOddsFormat)
  const toggleBots = useStore((s) => s.toggleBots)
  const resetOnboarding = useStore((s) => s.resetOnboarding)

  // Close on outside click + Escape, only while open.
  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const onReplayOnboarding = () => {
    resetOnboarding()
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Settings"
        className={clsx(
          'btn-ghost h-9 px-0 border border-ink-600 text-sm transition',
          label ? 'px-3 gap-2' : 'w-9',
          open && 'bg-ink-750 text-text',
        )}
      >
        <svg
          className={clsx('w-4 h-4 transition-transform duration-300', open && 'rotate-90')}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        {label && <span className="hidden lg:inline">Settings</span>}
      </button>

      {open && (
        <div
          role="menu"
          className="card absolute right-0 top-full mt-2 z-50 w-72 p-4 origin-top-right animate-pop-in shadow-2xl shadow-black/40"
        >
          {/* Odds format */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-faint">
              Odds format
            </h3>
            <div className="mt-2 flex flex-col gap-1.5">
              {ODDS_FORMATS.map((fmt) => {
                const active = fmt.key === oddsFormat
                return (
                  <button
                    key={fmt.key}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => setOddsFormat(fmt.key as OddsFormat)}
                    className={clsx(
                      'flex items-center justify-between rounded-lg px-3 py-2 text-left transition',
                      active
                        ? 'bg-brand text-white'
                        : 'bg-ink-800 text-text-muted hover:bg-ink-750 hover:text-text',
                    )}
                  >
                    <span className="text-sm font-semibold">{fmt.label}</span>
                    <span
                      className={clsx(
                        'text-xs tabular-nums',
                        active ? 'text-white/80' : 'text-text-faint',
                      )}
                    >
                      {fmt.sample}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <hr className="my-4 border-ink-700" />

          {/* Bot traders switch */}
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={botsEnabled}
            onClick={toggleBots}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <span>
              <span className="block text-sm font-semibold text-text">Bot traders</span>
              <span className="block text-xs text-text-faint">Simulated market activity</span>
            </span>
            <Switch on={botsEnabled} />
          </button>

          <hr className="my-4 border-ink-700" />

          {/* Replay onboarding */}
          <button
            type="button"
            role="menuitem"
            onClick={onReplayOnboarding}
            className="btn-ghost w-full justify-center border border-ink-600 py-2 text-sm"
          >
            Replay onboarding
          </button>

          <p className="mt-3 text-[11px] leading-snug text-text-faint">
            Preferences are stored locally on this device. Practice money only — no real funds.
          </p>
        </div>
      )}
    </div>
  )
}

function Switch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={clsx(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200',
        on ? 'bg-yes' : 'bg-ink-600',
      )}
    >
      <span
        className={clsx(
          'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 will-change-transform',
          on ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </span>
  )
}
