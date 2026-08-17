import assert from "node:assert/strict"
import test from "node:test"

import calc from "../.test-dist/calc.js"

const {
  computeAssets,
  computeNeeded,
  hasValidationErrors,
  requiredMonthlyForTarget,
  validatePage1,
  validatePage2,
} = calc

function page1(overrides = {}) {
  return {
    yearsToRetirement: "25",
    monthlyIncome: "60000",
    considerInflation: false,
    inflationRate: "2.5",
    includePension: false,
    pensionLumpSum: "0",
    method: "rule4",
    withdrawalRate: "4",
    retirementDuration: "30",
    retirementReturn: "4",
    ...overrides,
  }
}

function page2(overrides = {}) {
  return {
    growth: { amount: "0", returnRate: "9" },
    dividend: { amount: "0", returnRate: "6.5" },
    balanced: { amount: "0", returnRate: "4" },
    sip: { aReturn: "9", bReturn: "4", allocationA: "50" },
    ...overrides,
  }
}

test("4% 法則以全年所得的 25 倍計算退休本金", () => {
  const result = computeNeeded(page1())

  assert.equal(result.grossCapital, 18_000_000)
  assert.equal(result.capital, 18_000_000)
})

test("通膨後的退休本金會以退休當年勞退一次金折抵", () => {
  const result = computeNeeded(
    page1({
      yearsToRetirement: "10",
      monthlyIncome: "10000",
      considerInflation: true,
      inflationRate: "2",
      includePension: true,
      pensionLumpSum: "500000",
    }),
  )
  const expectedGross = 10_000 * 1.02 ** 10 * 12 * 25

  assert.ok(Math.abs(result.grossCapital - expectedGross) < 0.0001)
  assert.ok(Math.abs(result.capital - (expectedGross - 500_000)) < 0.0001)
  assert.equal(result.pensionApplied, 500_000)
})

test("指定年數且報酬為零時，以所得乘以領取年數計算", () => {
  const result = computeNeeded(
    page1({ method: "annuity", monthlyIncome: "50000", retirementDuration: "20", retirementReturn: "0" }),
  )

  assert.equal(result.capital, 12_000_000)
})

test("零報酬的每月投入為缺口除以總月數", () => {
  assert.equal(requiredMonthlyForTarget(120_000, 0, 1), 10_000)
})

test("每月投入使用有效月報酬率與月期數", () => {
  const target = 1_000_000
  const annualRate = 0.12
  const years = 10
  const monthly = requiredMonthlyForTarget(target, annualRate, years)
  const monthlyRate = (1 + annualRate) ** (1 / 12) - 1
  const months = years * 12
  const accumulated = monthly * (((1 + monthlyRate) ** months - 1) / monthlyRate)

  assert.ok(Math.abs(accumulated - target) < 0.0001)
})

test("沒有未來投入期間時，每月投入回傳零", () => {
  assert.equal(requiredMonthlyForTarget(1_000_000, 0.09, 0), 0)
})

test("資產剛好等於退休需求時視為達標", () => {
  const result = computeAssets(
    page1({ yearsToRetirement: "0", monthlyIncome: "1000" }),
    page2({ growth: { amount: "300000", returnRate: "9" } }),
  )

  assert.equal(result.needed, 300_000)
  assert.equal(result.totalFuture, 300_000)
  assert.equal(result.gap, 0)
  assert.equal(result.reachedTarget, true)
})

test("第一步驗證會拒絕空白、非整數與超出範圍的值", () => {
  const errors = validatePage1(
    page1({
      yearsToRetirement: "2.5",
      monthlyIncome: "",
      considerInflation: true,
      inflationRate: "21",
      method: "customRate",
      withdrawalRate: "0",
    }),
  )

  assert.match(errors.yearsToRetirement, /整數/)
  assert.match(errors.monthlyIncome, /請填寫/)
  assert.match(errors.inflationRate, /不可高於/)
  assert.match(errors.withdrawalRate, /不可低於/)
  assert.equal(hasValidationErrors(errors), true)
})

test("第二步驗證會拒絕空白金額與不合理報酬率", () => {
  const errors = validatePage2(
    page2({
      growth: { amount: "", returnRate: "31" },
      sip: { aReturn: "", bReturn: "-1", allocationA: "50" },
    }),
  )

  assert.match(errors.growth.amount, /請填寫/)
  assert.match(errors.growth.returnRate, /不可高於/)
  assert.match(errors.sip.aReturn, /請填寫/)
  assert.match(errors.sip.bReturn, /不可低於/)
  assert.equal(hasValidationErrors(errors), true)
})
