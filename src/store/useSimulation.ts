/**
 * Drives the "live" feel: ticks the bot simulator on a fast timer and re-polls
 * ESPN on a slow timer. Mount once near the app root.
 */
import { useEffect } from 'react'
import { useStore } from './useStore'

const BOT_INTERVAL = 1600 // ms — how often bots nudge prices
const POLL_INTERVAL = 30_000 // ms — how often we re-fetch ESPN scores

export function useSimulation() {
  const botsEnabled = useStore((s) => s.settings.botsEnabled)

  // Initial load — always refresh so status + live scores are current.
  useEffect(() => {
    void useStore.getState().refresh()
  }, [])

  // Bot heartbeat — pause when the tab is hidden to save cycles.
  useEffect(() => {
    if (!botsEnabled) return
    let timer: number | undefined
    const tick = () => {
      if (!document.hidden) useStore.getState().botTick()
    }
    timer = window.setInterval(tick, BOT_INTERVAL)
    return () => window.clearInterval(timer)
  }, [botsEnabled])

  // ESPN polling for live scores + auto-resolution.
  useEffect(() => {
    const poll = () => {
      if (!document.hidden) void useStore.getState().refresh()
    }
    const timer = window.setInterval(poll, POLL_INTERVAL)
    return () => window.clearInterval(timer)
  }, [])
}
