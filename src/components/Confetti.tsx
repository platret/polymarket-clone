import { useEffect, useRef, useState } from 'react'
import { useUI } from '../store/useUI'

const COLORS = ['#2d6cff', '#27ae8b', '#f5c518', '#e5484d', '#ffffff'] as const

interface Piece {
  id: number
  left: number
  size: number
  color: string
  rotate: number
  driftX: number
  delay: number
  duration: number
  round: boolean
}

let pieceSeq = 0

/** Build a single celebratory burst of confetti pieces using the browser RNG. */
function makeBurst(count: number): Piece[] {
  const pieces: Piece[] = []
  for (let i = 0; i < count; i++) {
    const size = 6 + Math.random() * 8
    pieces.push({
      id: pieceSeq++,
      left: Math.random() * 100,
      size,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotate: Math.random() * 720 - 360,
      driftX: Math.random() * 160 - 80,
      delay: Math.random() * 0.18,
      duration: 1.8 + Math.random() * 1.0,
      round: Math.random() < 0.35,
    })
  }
  return pieces
}

/**
 * Mount once near the app root. Watches `useUI(s => s.celebration)` and fires a
 * full-screen confetti burst from the top of the viewport whenever it increases.
 * Pieces self-remove once their fall animation completes.
 */
export function ConfettiHost() {
  const celebration = useUI((s) => s.celebration)
  const [pieces, setPieces] = useState<Piece[]>([])
  const prev = useRef(celebration)

  useEffect(() => {
    if (celebration > prev.current) {
      const burst = makeBurst(80)
      setPieces((current) => [...current, ...burst])
    }
    prev.current = celebration
  }, [celebration])

  function handleEnd(id: number) {
    setPieces((current) => current.filter((p) => p.id !== id))
  }

  if (pieces.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      <style>{KEYFRAMES}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          onAnimationEnd={() => handleEnd(p.id)}
          style={{
            position: 'absolute',
            top: '-5%',
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.round ? p.size : p.size * 0.5}px`,
            background: p.color,
            borderRadius: p.round ? '9999px' : '1px',
            boxShadow: '0 0 6px rgba(0,0,0,0.25)',
            opacity: 0,
            willChange: 'transform, opacity',
            // CSS custom props consumed by the keyframes below.
            ['--drift' as string]: `${p.driftX}px`,
            ['--spin' as string]: `${p.rotate}deg`,
            animation: `confetti-fall ${p.duration}s cubic-bezier(0.2, 0.6, 0.4, 1) ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  )
}

const KEYFRAMES = `
@keyframes confetti-fall {
  0% {
    transform: translate3d(0, -10vh, 0) rotate(0deg);
    opacity: 0;
  }
  8% {
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    transform: translate3d(var(--drift, 0px), 110vh, 0) rotate(var(--spin, 360deg));
    opacity: 0;
  }
}
`
