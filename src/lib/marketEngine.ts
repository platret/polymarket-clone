/**
 * LMSR (Logarithmic Market Scoring Rule) — the maths behind a Polymarket-style
 * binary market. Prices live in (0,1) and always sum to $1 across YES/NO.
 * Buying a side pushes its price up; selling pushes it down. Winning shares
 * redeem for $1.00 at resolution.
 *
 * Pure functions only — no state. The store owns the (qYes, qNo) numbers.
 */
import type { Market, Side } from '../types'

/** Numerically-stable YES price = softmax over the two share quantities. */
export function priceYes(qYes: number, qNo: number, b: number): number {
  if (!(b > 0)) b = 1 // defensive: b must be positive
  const m = Math.max(qYes, qNo)
  const eY = Math.exp((qYes - m) / b)
  const eN = Math.exp((qNo - m) / b)
  return eY / (eY + eN)
}

/** LMSR cost function C(q) — total collateral the maker holds. */
export function cost(qYes: number, qNo: number, b: number): number {
  const m = Math.max(qYes, qNo)
  return m + b * Math.log(Math.exp((qYes - m) / b) + Math.exp((qNo - m) / b))
}

export function yesPrice(mkt: Pick<Market, 'qYes' | 'qNo' | 'b'>): number {
  return priceYes(mkt.qYes, mkt.qNo, mkt.b)
}

export function sidePrice(mkt: Pick<Market, 'qYes' | 'qNo' | 'b'>, side: Side): number {
  const y = yesPrice(mkt)
  return side === 'YES' ? y : 1 - y
}

/** $ cost to buy `n` shares of `side` (n > 0). */
export function buyCost(mkt: Pick<Market, 'qYes' | 'qNo' | 'b'>, side: Side, n: number): number {
  const c0 = cost(mkt.qYes, mkt.qNo, mkt.b)
  const qY = side === 'YES' ? mkt.qYes + n : mkt.qYes
  const qN = side === 'NO' ? mkt.qNo + n : mkt.qNo
  return cost(qY, qN, mkt.b) - c0
}

/** $ returned for selling `n` shares of `side` (n > 0). */
export function sellReturn(mkt: Pick<Market, 'qYes' | 'qNo' | 'b'>, side: Side, n: number): number {
  const c0 = cost(mkt.qYes, mkt.qNo, mkt.b)
  const qY = side === 'YES' ? mkt.qYes - n : mkt.qYes
  const qN = side === 'NO' ? mkt.qNo - n : mkt.qNo
  return c0 - cost(qY, qN, mkt.b)
}

/** Given a $ budget, how many shares of `side` can you buy? (binary search) */
export function sharesForBudget(mkt: Pick<Market, 'qYes' | 'qNo' | 'b'>, side: Side, budget: number): number {
  if (budget <= 0) return 0
  let lo = 0
  let hi = 1
  while (buyCost(mkt, side, hi) < budget && hi < 1e12) hi *= 2
  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) / 2
    if (buyCost(mkt, side, mid) < budget) lo = mid
    else hi = mid
  }
  return lo
}

/** Returns the new (qYes, qNo) after buying `n` shares of `side`. */
export function applyBuy(qYes: number, qNo: number, side: Side, n: number): { qYes: number; qNo: number } {
  return side === 'YES' ? { qYes: qYes + n, qNo } : { qYes, qNo: qNo + n }
}

/** Returns the new (qYes, qNo) after selling `n` shares of `side`. */
export function applySell(qYes: number, qNo: number, side: Side, n: number): { qYes: number; qNo: number } {
  return side === 'YES' ? { qYes: Math.max(0, qYes - n), qNo } : { qYes, qNo: Math.max(0, qNo - n) }
}

/** Seed (qYes, qNo) so that the starting YES price equals `p` (0..1). */
export function seedQuantities(b: number, p: number): { qYes: number; qNo: number } {
  const pp = Math.min(0.98, Math.max(0.02, p)) // same bounds as adminSetPrice
  // price = sigmoid((qYes - qNo)/b)  =>  qYes - qNo = b * ln(p/(1-p))
  return { qYes: b * Math.log(pp / (1 - pp)), qNo: 0 }
}

/** Convert an American moneyline (e.g. -150, +220) to an implied probability. */
export function moneylineToProb(ml: number): number {
  if (ml < 0) return -ml / (-ml + 100)
  return 100 / (ml + 100)
}

/** Normalise two implied probs that sum > 1 (the bookmaker vig) back to 1. */
export function devig(pHome: number, pAway: number): number {
  const total = pHome + pAway
  if (total <= 0) return 0.5
  return pHome / total
}
