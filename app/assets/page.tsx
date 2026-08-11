"use client"

import Link from "next/link"
import { ArrowLeft, CircleCheck, TriangleAlert, Wallet } from "lucide-react"
import { useRetirement } from "@/lib/retirement-context"
import { computeAssets, formatTWD, formatWan } from "@/lib/calc"
import { NumberField } from "@/components/number-field"

function SipLegRow({ label, monthly }: { label: string; monthly: number }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-base font-semibold tabular-nums text-foreground">
        {formatTWD(monthly)}
        <span className="text-xs font-normal text-muted-foreground"> / 月</span>
      </span>
    </div>
  )
}

const categories = [
  {
    key: "growth" as const,
    title: "市值型與個股 / 基金",
    desc: "成長性高、波動較大",
    defaultReturn: "9.0",
  },
  {
    key: "dividend" as const,
    title: "高股息與穩健型股票",
    desc: "配息穩定、波動中等",
    defaultReturn: "6.5",
  },
  {
    key: "balanced" as const,
    title: "組合型／多元資產基金",
    desc: "股債配置、追求穩健",
    defaultReturn: "4.0",
  },
]

export default function AssetsPage() {
  const { page1, page2, setPage2Category, setSip } = useRetirement()
  const result = computeAssets(page1, page2)

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
      {/* 資產輸入 */}
      <section aria-labelledby="assets-title" className="flex flex-col gap-6">
        <div>
          <p className="text-sm font-medium text-primary">步驟 2</p>
          <h1 id="assets-title" className="mt-1 text-2xl font-semibold tracking-tight text-balance">
            目前的資產配置
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            填入每一類目前擁有的金額與預期年報酬（每年複利），估算 {result.years} 年後退休當年的財富。
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {categories.map((c) => (
            <div key={c.key} className="grid gap-4 rounded-xl border border-border bg-card p-5">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{c.title}</h2>
                <p className="text-xs text-muted-foreground">{c.desc}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="目前擁有金額"
                  value={page2[c.key].amount}
                  onChange={(v) => setPage2Category(c.key, "amount", v)}
                  suffix="元"
                  thousands
                />
                <NumberField
                  label="預期年報酬"
                  value={page2[c.key].returnRate}
                  onChange={(v) => setPage2Category(c.key, "returnRate", v)}
                  suffix="%"
                  hint={`未填預設 ${c.defaultReturn}%`}
                  step={0.1}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                退休當年預估成長為{" "}
                <span className="font-mono font-medium text-foreground">
                  {formatTWD(result[c.key].future)}
                </span>
              </p>
            </div>
          ))}
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 self-start rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          回上一步修改目標
        </Link>
      </section>

      {/* 結果 */}
      <section aria-labelledby="assets-result-title" className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
        {/* 預估財富 vs 目標 */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-primary">
            <Wallet className="size-4" aria-hidden="true" />
            <h2 id="assets-result-title" className="text-sm font-medium">
              退休當年預估財富
            </h2>
          </div>
          <div>
            <p className="font-mono text-3xl font-semibold tracking-tight tabular-nums text-foreground sm:text-4xl">
              {formatTWD(result.totalFuture)}
            </p>
            <p className="mt-1 font-mono text-sm text-muted-foreground">約 {formatWan(result.totalFuture)}</p>
          </div>
          <dl className="grid gap-2.5 border-t border-border pt-4 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">目前總資產</dt>
              <dd className="font-mono font-medium tabular-nums text-foreground">{formatTWD(result.totalNow)}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">退休所需資金</dt>
              <dd className="font-mono font-medium tabular-nums text-foreground">{formatTWD(result.needed)}</dd>
            </div>
          </dl>
        </div>

        {/* 缺口 / 定期定額 */}
        {result.reachedTarget ? (
          <div className="flex flex-col gap-3 rounded-xl border border-positive/30 bg-positive/10 p-5">
            <div className="flex items-center gap-2 text-positive">
              <CircleCheck className="size-5" aria-hidden="true" />
              <h2 className="text-sm font-semibold">目標已達成</h2>
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              以目前的配置估算，退休當年就能超過目標，還多出約{" "}
              <span className="font-mono font-medium text-positive">{formatWan(-result.gap)}</span>。
              可以考慮提早退休或調整成更穩健的配置。
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-xl border border-warning/35 bg-warning/10 p-5">
            <div className="flex items-center gap-2 text-warning">
              <TriangleAlert className="size-5" aria-hidden="true" />
              <h2 className="text-sm font-semibold">還差一段距離</h2>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">退休當年預估缺口</p>
              <p className="mt-0.5 font-mono text-2xl font-semibold tabular-nums text-foreground">
                {formatTWD(result.gap)}
              </p>
            </div>

            <div className="flex flex-col gap-4 border-t border-warning/25 pt-4">
              <div>
                <p className="text-sm font-medium text-foreground">每月還需定期定額</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  把缺口分配到兩種不同報酬率的標的，分別算出每月投入金額。
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="積極標的年報酬"
                  value={page2.sip.aReturn}
                  onChange={(v) => setSip("aReturn", v)}
                  suffix="%"
                  step={0.1}
                />
                <NumberField
                  label="穩健標的年報酬"
                  value={page2.sip.bReturn}
                  onChange={(v) => setSip("bReturn", v)}
                  suffix="%"
                  step={0.1}
                />
              </div>

              {/* 缺口分配比例 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <label htmlFor="alloc" className="font-medium text-foreground">
                    缺口分配
                  </label>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    積極 {Math.round(result.sipA.allocation * 100)}% ／ 穩健{" "}
                    {Math.round(result.sipB.allocation * 100)}%
                  </span>
                </div>
                <input
                  id="alloc"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={page2.sip.allocationA}
                  onChange={(e) => setSip("allocationA", e.target.value)}
                  className="w-full accent-primary"
                  aria-label="分配給積極標的的缺口百分比"
                />
              </div>

              <div className="grid gap-2">
                <SipLegRow
                  label={`積極標的 · ${page2.sip.aReturn || "9.0"}%`}
                  monthly={result.sipA.requiredMonthly}
                />
                <SipLegRow
                  label={`穩健標的 · ${page2.sip.bReturn || "4.0"}%`}
                  monthly={result.sipB.requiredMonthly}
                />
                <div className="mt-1 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/8 p-4">
                  <span className="text-sm font-medium text-foreground">
                    每月合計投入
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                      持續 {result.years} 年補足缺口
                    </span>
                  </span>
                  <span className="font-mono text-2xl font-semibold tabular-nums text-primary">
                    {formatTWD(result.requiredMonthlySip)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="px-1 text-xs leading-relaxed text-muted-foreground">
          本試算採年複利與簡化假設，僅供規劃參考，不構成投資建議。實際報酬會隨市場波動。
        </p>
      </section>
    </main>
  )
}
