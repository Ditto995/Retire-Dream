"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PiggyBank } from "lucide-react"

const steps = [
  { href: "/", step: 1, title: "退休目標", desc: "需要累積多少" },
  { href: "/assets", step: 2, title: "資產與定額", desc: "還差多少 / 每月要投入" },
]

export function StepNav() {
  const pathname = usePathname()

  return (
    <header className="border-b border-border bg-card/60 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PiggyBank className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-none text-foreground">退休資產配置試算</p>
            <p className="mt-1 text-xs text-muted-foreground">兩步驟算出你的退休缺口</p>
          </div>
        </div>

        <nav aria-label="步驟" className="grid grid-cols-2 gap-2">
          {steps.map((s) => {
            const active = pathname === s.href
            return (
              <Link
                key={s.href}
                href={s.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                  active
                    ? "border-primary bg-primary/8 text-foreground"
                    : "border-border bg-transparent text-muted-foreground hover:bg-muted"
                }`}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.step}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{s.title}</span>
                  <span className="block truncate text-xs opacity-80">{s.desc}</span>
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
