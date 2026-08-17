export type Method = "rule4" | "customRate" | "annuity"

export interface Page1State {
  yearsToRetirement: string
  monthlyIncome: string
  considerInflation: boolean
  inflationRate: string
  includePension: boolean
  /** 勞退一次金於退休當年的預估名目金額。 */
  pensionLumpSum: string
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

export type Page1ValidationErrors = Partial<Record<keyof Page1State, string>>

export interface Page2ValidationErrors {
  growth: Partial<Record<keyof AssetCategory, string>>
  dividend: Partial<Record<keyof AssetCategory, string>>
  balanced: Partial<Record<keyof AssetCategory, string>>
  sip: Partial<Record<keyof SipPlan, string>>
}

interface NumberRule {
  label: string
  min?: number
  max?: number
  integer?: boolean
  greaterThan?: number
}

function validateNumber(value: string, rule: NumberRule): string | undefined {
  if (value.trim() === "") return `請填寫${rule.label}`

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return `${rule.label}必須是有效數字`
  if (rule.integer && !Number.isInteger(parsed)) return `${rule.label}必須是整數`
  if (rule.greaterThan !== undefined && parsed <= rule.greaterThan) {
    return `${rule.label}必須大於 ${rule.greaterThan}`
  }
  if (rule.min !== undefined && parsed < rule.min) return `${rule.label}不可低於 ${rule.min}`
  if (rule.max !== undefined && parsed > rule.max) return `${rule.label}不可高於 ${rule.max}`

  return undefined
}

export function validatePage1(s: Page1State): Page1ValidationErrors {
  const errors: Page1ValidationErrors = {
    yearsToRetirement: validateNumber(s.yearsToRetirement, {
      label: "退休年數",
      min: 0,
      max: 80,
      integer: true,
    }),
    monthlyIncome: validateNumber(s.monthlyIncome, {
      label: "每月所得需求",
      greaterThan: 0,
    }),
  }

  if (s.considerInflation) {
    errors.inflationRate = validateNumber(s.inflationRate, {
      label: "年通膨率",
      min: 0,
      max: 20,
    })
  }

  if (s.includePension) {
    errors.pensionLumpSum = validateNumber(s.pensionLumpSum, {
      label: "勞退一次金",
      min: 0,
    })
  }

  if (s.method === "customRate") {
    errors.withdrawalRate = validateNumber(s.withdrawalRate, {
      label: "安全提領率",
      min: 0.1,
      max: 20,
    })
  }

  if (s.method === "annuity") {
    errors.retirementDuration = validateNumber(s.retirementDuration, {
      label: "退休後領取年數",
      min: 1,
      max: 80,
      integer: true,
    })
    errors.retirementReturn = validateNumber(s.retirementReturn, {
      label: "退休後資金報酬率",
      min: 0,
      max: 30,
    })
  }

  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message))
}

function validateAssetCategory(category: AssetCategory, label: string) {
  return {
    amount: validateNumber(category.amount, { label: `${label}目前金額`, min: 0 }),
    returnRate: validateNumber(category.returnRate, {
      label: `${label}預期年報酬率`,
      min: 0,
      max: 30,
    }),
  }
}

export function validatePage2(s: Page2State): Page2ValidationErrors {
  return {
    growth: validateAssetCategory(s.growth, "市值型資產"),
    dividend: validateAssetCategory(s.dividend, "高股息資產"),
    balanced: validateAssetCategory(s.balanced, "多元資產"),
    sip: {
      aReturn: validateNumber(s.sip.aReturn, {
        label: "積極標的年報酬率",
        min: 0,
        max: 30,
      }),
      bReturn: validateNumber(s.sip.bReturn, {
        label: "穩健標的年報酬率",
        min: 0,
        max: 30,
      }),
      allocationA: validateNumber(s.sip.allocationA, {
        label: "積極標的分配比例",
        min: 0,
        max: 100,
      }),
    },
  }
}

export function hasValidationErrors(errors: object): boolean {
  return Object.values(errors).some((value) =>
    typeof value === "object" && value !== null ? hasValidationErrors(value) : Boolean(value),
  )
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
  /** 於退休當年用來折抵需求的勞退一次金（名目金額）。 */
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
  
  // 退休當年每月生活費需求（名目）與全年需求
  const monthlyAtRetirement = monthlyToday * inflationFactor
  const annualAtRetirement = monthlyAtRetirement * 12

  // 1. 先計算「尚未扣除勞退」前的退休總本金需求 (grossCapital)
  let grossCapital = 0
  let methodLabel = ""

  if (s.method === "rule4") {
    grossCapital = annualAtRetirement / 0.04
    methodLabel = "4% 法則（年支出 × 25）"
  } else if (s.method === "customRate") {
    const rate = Math.max(0.1, num(s.withdrawalRate, 4)) / 100
    grossCapital = annualAtRetirement / rate
    methodLabel = `安全提領率 ${num(s.withdrawalRate, 4)}%`
  } else {
    const duration = Math.max(1, num(s.retirementDuration, 30))
    const r = Math.max(0, num(s.retirementReturn, 4)) / 100
    if (r === 0) {
      grossCapital = annualAtRetirement * duration
    } else {
      // present value of a level annuity paid over `duration` years
      grossCapital = annualAtRetirement * ((1 - Math.pow(1 + r, -duration)) / r)
    }
    methodLabel = `領完 ${duration} 年（退休後報酬 ${num(s.retirementReturn, 4)}%）`
  }

  // 2. 以退休當年的勞退一次金折抵需求（不接受勞保月領年金，也不重複計算通膨）。
  let pensionApplied = 0
  if (s.includePension) {
    pensionApplied = Math.max(0, num(s.pensionLumpSum))
  }

  // 3. 計算需自備的退休本金 (名目與實質)
  const capital = Math.max(0, grossCapital - pensionApplied)
  const capitalReal = inflationFactor > 0 ? capital / inflationFactor : capital

  return {
    years,
    inflationRate,
    monthlyToday,
    monthlyAtRetirement,
    annualAtRetirement,
    grossCapital,
    pensionApplied,
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

/**
 * End-of-month contribution needed to accumulate `target` over `years`.
 * `rate` is an effective annual return converted to an effective monthly rate.
 */
export function requiredMonthlyForTarget(target: number, rate: number, years: number): number {
  if (target <= 0 || years <= 0) return 0
  const months = years * 12
  if (rate === 0) return target / months
  const monthlyRate = Math.pow(1 + rate, 1 / 12) - 1
  const futureValueFactor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate
  return target / futureValueFactor
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
