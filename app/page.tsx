"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowRight, Check, TrendingUp } from "lucide-react"
import { useRetirement } from "@/lib/retirement-context"
import { computeNeeded, formatTWD, formatWan, type Method } from "@/lib/calc"
import { NumberField } from "@/components/number-field"

const methods: { id: Method; title: string; desc: string }[] = [
  { id: "rule4", title: "4% 法則", desc: "年支出 × 25，最通用" },
  { id: "customRate", title: "自訂提領率", desc: "自己設定安全提領率" },
  { id: "annuity", title: "指定年數領完", desc: "退休後領 N 年、含報酬" },
]

export default function Page() {
  const { page1, setPage1 } = useRetirement()

  // 使用 useMemo 確保狀態變更時的計算效能
  const result = useMemo(() => computeNeeded(page1), [page1])

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
      {/* 表單 */}
      <section aria-labelledby="form-title" className="flex flex-col gap-6">
        <div>
          <p className="text-sm font-medium text-primary">步驟 1</p>
          <h1 id="form-title" className="mt-1 text-2xl font-semibold tracking-tight text-balance">
            你的退休目標
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            填入退休時間與期望的生活水準，算出退休當年需要累積的資金。
          </p>
        </div>

        <div className="grid gap-5 rounded-xl border border-border bg-card p-5">
          <NumberField
            label="預計還要幾年退休"
            value={page1.yearsToRetirement}
            onChange={(v) => setPage1("yearsToRetirement", v)}
            suffix="年"
            step={1}
          />
          <NumberField
            label="希望每月有多少所得"
            value={page1.monthlyIncome}
            onChange={(v) => setPage1("monthlyIncome", v)}
            suffix="元 / 月"
            hint="以「現在的物價」來想像你想要的生活水準即可。"
            thousands
          />

          {/* 通膨勾選 */}
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4">
            <button
              type="button"
              role="switch"
              aria-checked={page1.considerInflation}
              aria-expanded={page1.considerInflation}
              onClick={() => setPage1("considerInflation", !page1.considerInflation)}
              className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-[6px] border transition-colors ${
                  page1.considerInflation
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-card"
                }`}
              >
                {page1.considerInflation && <Check className="size-3.5" aria-hidden="true" />}
              </span>
              <span>
                <span className="block text-sm font-medium text-foreground">將通膨率考慮進去</span>
                <span className="block text-xs text-muted-foreground">
                  把月所得依通膨膨脹到退休當年，需求會更貼近現實。
                </span>
              </span>
            </button>

            {page1.considerInflation && (
              <NumberField
                label="預估年通膨率"
                value={page1.inflationRate}
                onChange={(v) => setPage1("inflationRate", v)}
                suffix="%"
                step={0.1}
              />
            )}
          </div>

          {/* 勞退一次金勾選 */}
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4">
            <button
              type="button"
              role="switch"
              aria-checked={page1.includePension}
              aria-expanded={page1.includePension}
              onClick={() => setPage1("includePension", !page1.includePension)}
              className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-[6px] border transition-colors ${
                  page1.includePension
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-card"
                }`}
              >
                {page1.includePension && <Check className="size-3.5" aria-hidden="true" />}
              </span>
              <span>
                <span className="block text-sm font-medium text-foreground">加入勞退一次金</span>
                <span className="block text-xs text-muted-foreground">
                  以退休當年預估可領的一次金，折抵所需退休本金。
                </span>
              </span>
            </button>

            {page1.includePension && (
              <div className="mt-2 flex flex-col gap-4 border-t border-border/60 pt-3">
                <NumberField
                  label="預估勞退一次金"
                  value={page1.pensionLumpSum}
                  onChange={(v) => setPage1("pensionLumpSum", v)}
                  suffix="元"
                  hint="填入退休當年預估可領的一次金；請勿填入勞保月領年金。"
                  thousands
                />
              </div>
            )}
          </div>

          {/* 換算方式 */}
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-1 text-sm font-medium text-foreground">所需資金換算方式</legend>
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
              {methods.map((m) => {
                const active = page1.method === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPage1("method", m.id)}
                    className={`flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      active
                        ? "border-primary bg-primary/8 ring-1 ring-primary"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    <span className="text-sm font-medium text-foreground">{m.title}</span>
                    <span className="text-xs leading-snug text-muted-foreground">{m.desc}</span>
                  </button>
                )
              })}
            </div>

            {page1.method === "customRate" && (
              <div className="mt-1">
                <NumberField
                  label="安全提領率"
                  value={page1.withdrawalRate}
                  onChange={(v) => setPage1("withdrawalRate", v)}
                  suffix="%"
                  hint="越低越保守（需要更多本金）。常見範圍 3%～5%。"
                  step={0.1}
                />
              </div>
            )}

            {page1.method === "annuity" && (
              <div className="mt-1 grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="退休後要領幾年"
                  value={page1.retirementDuration}
                  onChange={(v) => setPage1("retirementDuration", v)}
                  suffix="年"
                  step={1}
                />
                <NumberField
                  label="退休後資金報酬率"
                  value={page1.retirementReturn}
                  onChange={(v) => setPage1("retirementReturn", v)}
                  suffix="%"
                  step={0.1}
                />
              </div>
            )}
          </fieldset>
        </div>
      </section>

      {/* 結果 */}
      <section aria-labelledby="result-title" className="lg:sticky lg:top-6 lg:self-start">
        <div className="flex flex-col gap-5 rounded-xl border border-primary/25 bg-primary/5 p-5">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="size-4" aria-hidden="true" />
            <h2 id="result-title" className="text-sm font-medium">
              退休當年需自備的資金缺口
            </h2>
          </div>

          <div>
            <p className="font-mono text-3xl font-semibold tracking-tight tabular-nums text-foreground sm:text-4xl">
              {formatTWD(result.capital)}
            </p>
            <p className="mt-1 font-mono text-sm text-muted-foreground">約 {formatWan(result.capital)}</p>
          </div>

          {page1.considerInflation && (
            <div className="rounded-lg border border-border bg-card/70 p-3.5">
              <p className="text-xs font-medium text-muted-foreground">實質購買力折算</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                這筆 <span className="font-mono font-medium">{formatWan(result.capital)}</span>，大約等於現在的{" "}
                <span className="font-mono font-medium text-primary">{formatWan(result.capitalReal)}</span> 的價值。
              </p>
            </div>
          )}

          <dl className="grid gap-2.5 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">換算方式</dt>
              <dd className="text-right font-medium text-foreground">{result.methodLabel}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">退休當年月所得需求</dt>
              <dd className="font-mono font-medium tabular-nums text-foreground">
                {formatTWD(result.monthlyAtRetirement)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">目標總本金需求</dt>
              <dd className="font-mono font-medium tabular-nums text-foreground">
                {formatTWD(result.grossCapital)}
              </dd>
            </div>
            {page1.includePension && (
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">勞退一次金折抵</dt>
                <dd className="font-mono font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                  − {formatTWD(result.pensionApplied)}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2 font-medium">
              <dt className="text-foreground">需自備總本金</dt>
              <dd className="font-mono tabular-nums text-primary">
                {formatTWD(result.capital)}
              </dd>
            </div>
          </dl>

          <Link
            href="/assets"
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            下一步：加入現有資產
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  )
}
