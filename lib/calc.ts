export type Method = "rule4" | "customRate" | "annuity"

export interface Page1State {
  yearsToRetirement: string
  monthlyIncome: string
  considerInflation: boolean
  inflationRate: string
  includePension: boolean
  /** Lump-sum retirement fund total (e.g. 勞退新制試算表的「預估可累積退休金及收益」). */
  pensionLumpSum: string
  /** true = the amount is in today's dollars and must be inflated to retirement; false = it is already the retirement-year value. */
  pensionIsTodayValue: boolean
  method: Method
  withdrawalRate: string
  retirementDuration: string
  retirementReturn: string
}

export interface AssetCategory {
  amount: string
  returnRate: string
}

export interface SipPlan {
  aReturn: string // 積極標的年報酬
  bReturn: string // 穩健標的年報酬
  allocationA: string // 缺口分配給積極標的的百分比
}

export interface Page2State {
  growth: AssetCategory // 市值型與個股/基金
  dividend: AssetCategory // 高股息與穩健型股票
  balanced: AssetCategory // 組合型／多元資產基金
  sip: SipPlan
}

/** Parse a numeric input string, returning a fallback when empty/invalid. */
export function num(value: string, fallback = 0): number {
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : fallback
}

export interface NeededResult {
  years: number
  inflationRate: number // decimal
  monthlyToday: number
  monthlyAtRetirement: number
  annualAtRetirement: number
  /** Capital needed from the income requirement alone, before any pension offset. */
  grossCapital: number
  /** Lump-sum government retirement fund applied at the retirement year (nominal). */
  pensionApplied: number
  /** Nominal capital you must accumulate yourself = grossCapital − pensionApplied. */
  capital: number
  /** Real (today's purchasing power) value of that self-funded capital. */
  capitalReal: number
  methodLabel: string
}

export function computeNeeded(s: Page1State): NeededResult {
  const years = Math.max(0, num(s.yearsToRetirement))
  const monthlyToday = Math.max(0, num(s.monthlyIncome))
  const inflationRate = s.considerInflation ? Math.max(0, num(s.inflationRate)) / 100 : 0

  const inflationFactor = Math.pow(1 + inflationRate, years)
  const monthlyAtRetirement = monthlyToday * inflationFactor

  // 政府年金（勞退/勞保）以今日幣值輸入，假設隨通膨調整，膨脹到退休當年。
  const pensionToday = s.includePension ? Math.max(0, num(s.monthlyPension)) : 0
  const pensionAtRetirement = pensionToday * inflationFactor

  // 投資組合真正需要支應的月所得 = 期望所得 − 政府年金。
  const netMonthlyAtRetirement = Math.max(0, monthlyAtRetirement - pensionAtRetirement)
  const annualAtRetirement = netMonthlyAtRetirement * 12

  let capital = 0
  let methodLabel = ""

  if (s.method === "rule4") {
    capital = annualAtRetirement / 0.04
    methodLabel = "4% 法則（年支出 × 25）"
  } else if (s.method === "customRate") {
    const rate = Math.max(0.1, num(s.withdrawalRate, 4)) / 100
    capital = annualAtRetirement / rate
    methodLabel = `安全提領率 ${num(s.withdrawalRate, 4)}%`
  } else {
    const duration = Math.max(1, num(s.retirementDuration, 30))
    const r = Math.max(0, num(s.retirementReturn, 4)) / 100
    if (r === 0) {
      capital = annualAtRetirement * duration
    } else {
      // present value of a level annuity paid over `duration` years
      capital = annualAtRetirement * ((1 - Math.pow(1 + r, -duration)) / r)
    }
    methodLabel = `領完 ${duration} 年（退休後報酬 ${num(s.retirementReturn, 4)}%）`
  }

  const capitalReal = inflationFactor > 0 ? capital / inflationFactor : capital

  return {
    years,
    inflationRate,
    monthlyToday,
    monthlyAtRetirement,
    pensionAtRetirement,
    netMonthlyAtRetirement,
    annualAtRetirement,
    capital,
    capitalReal,
    methodLabel,
  }
}

export interface CategoryProjection {
  amount: number
  returnRate: number // decimal
  future: number
}

export interface SipLeg {
  returnRate: number // decimal
  allocation: number // decimal share of the shortfall
  gapShare: number // portion of the shortfall (nominal) this leg must cover
  requiredMonthly: number // monthly contribution needed for this leg
}

export interface AssetsResult {
  years: number
  growth: CategoryProjection
  dividend: CategoryProjection
  balanced: CategoryProjection
  totalNow: number
  totalFuture: number
  needed: number
  gap: number // positive means shortfall
  reachedTarget: boolean
  /** Aggressive SIP target. */
  sipA: SipLeg
  /** Stable SIP target. */
  sipB: SipLeg
  /** Combined monthly regular investment across both targets. */
  requiredMonthlySip: number
}

/** Monthly contribution needed to accumulate `target` over `years` at annual `rate`. */
function requiredMonthlyForTarget(target: number, rate: number, years: number): number {
  if (target <= 0 || years <= 0) return 0
  if (rate === 0) return target / (12 * years)
  const factor = (Math.pow(1 + rate, years) - 1) / rate
  return target / (12 * factor)
}

function projectCategory(c: AssetCategory, defaultReturn: number, years: number): CategoryProjection {
  const amount = Math.max(0, num(c.amount))
  const returnRate = num(c.returnRate, defaultReturn) / 100
  const future = amount * Math.pow(1 + returnRate, years)
  return { amount, returnRate, future }
}

export function computeAssets(p1: Page1State, p2: Page2State): AssetsResult {
  const needed = computeNeeded(p1)
  const years = needed.years

  const growth = projectCategory(p2.growth, 9.0, years)
  const dividend = projectCategory(p2.dividend, 6.5, years)
  const balanced = projectCategory(p2.balanced, 4.0, years)

  const totalNow = growth.amount + dividend.amount + balanced.amount
  const totalFuture = growth.future + dividend.future + balanced.future

  const gap = needed.capital - totalFuture
  const reachedTarget = gap <= 0
  const shortfall = reachedTarget ? 0 : gap

  const aReturn = Math.max(0, num(p2.sip.aReturn, 9)) / 100
  const bReturn = Math.max(0, num(p2.sip.bReturn, 4)) / 100
  // 分配給積極標的的百分比，其餘給穩健標的。
  const allocA = Math.min(100, Math.max(0, num(p2.sip.allocationA, 50))) / 100
  const allocB = 1 - allocA

  const gapShareA = shortfall * allocA
  const gapShareB = shortfall * allocB

  const sipA: SipLeg = {
    returnRate: aReturn,
    allocation: allocA,
    gapShare: gapShareA,
    requiredMonthly: requiredMonthlyForTarget(gapShareA, aReturn, years),
  }
  const sipB: SipLeg = {
    returnRate: bReturn,
    allocation: allocB,
    gapShare: gapShareB,
    requiredMonthly: requiredMonthlyForTarget(gapShareB, bReturn, years),
  }
  const requiredMonthlySip = sipA.requiredMonthly + sipB.requiredMonthly

  return {
    years,
    growth,
    dividend,
    balanced,
    totalNow,
    totalFuture,
    needed: needed.capital,
    gap,
    reachedTarget,
    sipA,
    sipB,
    requiredMonthlySip,
  }
}

const twd = new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 })

export function formatTWD(n: number): string {
  if (!Number.isFinite(n)) return "—"
  return `NT$ ${twd.format(Math.round(n))}`
}

/** Convert to 萬 (ten-thousands) with one decimal for readability. */
export function formatWan(n: number): string {
  if (!Number.isFinite(n)) return "—"
  const wan = n / 10000
  const formatted = new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 1 }).format(wan)
  return `${formatted} 萬`
}
