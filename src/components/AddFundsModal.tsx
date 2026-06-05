import { useState } from 'react'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { usd } from '../lib/format'
import { Modal } from './Modal'

const CHIPS = [100, 500, 1000, 10000]

export function AddFundsModal() {
  const open = useUI((s) => s.fundsOpen)
  const setOpen = useUI((s) => s.setFundsOpen)
  const pushToast = useUI((s) => s.pushToast)
  const balance = useStore((s) => s.balance)
  const addFunds = useStore((s) => s.addFunds)
  const resetAll = useStore((s) => s.resetAll)
  const [amount, setAmount] = useState(1000)

  const add = () => {
    if (amount > 0) {
      addFunds(amount)
      pushToast({ kind: 'success', title: `Added ${usd(amount)} fake cash` })
      setOpen(false)
    }
  }

  const reset = async () => {
    if (confirm('Reset everything? This wipes your balance, bets, and trade history, then reloads fresh markets.')) {
      await resetAll()
      pushToast({ kind: 'info', title: 'Everything reset', detail: 'Back to $10,000.00' })
      setOpen(false)
    }
  }

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Add fake funds">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">Current cash</span>
          <span className="font-bold tabular-nums text-yes">{usd(balance)}</span>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
          <input
            type="number" min={0} value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
            className="input pl-7 text-lg font-bold tabular-nums"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {CHIPS.map((c) => (
            <button key={c} onClick={() => setAmount(c)} className="btn-ghost py-2 text-sm">
              ${c.toLocaleString()}
            </button>
          ))}
        </div>

        <button onClick={add} className="btn-brand py-3 font-bold">Add {usd(amount)}</button>

        <div className="h-px bg-ink-600" />
        <button onClick={reset} className="text-sm text-no hover:underline self-start">
          Reset everything to $10,000
        </button>
      </div>
    </Modal>
  )
}
