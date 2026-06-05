import { create } from 'zustand'

export interface Toast {
  id: number
  kind: 'success' | 'error' | 'info'
  title: string
  detail?: string
}

interface UIState {
  toasts: Toast[]
  fundsOpen: boolean
  celebration: number // bumped to trigger a confetti burst
  pushToast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
  setFundsOpen: (open: boolean) => void
  celebrate: () => void
}

let counter = 1

export const useUI = create<UIState>((set) => ({
  toasts: [],
  fundsOpen: false,
  celebration: 0,
  celebrate: () => set((s) => ({ celebration: s.celebration + 1 })),
  pushToast: (t) => {
    const id = counter++
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
    window.setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 3800)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  setFundsOpen: (open) => set({ fundsOpen: open }),
}))
