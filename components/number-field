"use client"

import { useId, type ChangeEvent } from "react"

interface NumberFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  suffix?: string
  placeholder?: string
  hint?: string
  min?: number
  step?: number
  /** Display the value with thousands separators (for money amounts). */
  thousands?: boolean
}

const grouper = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })

/** Format a raw numeric string with thousands separators, preserving empty input. */
function withCommas(raw: string): string {
  if (raw === "") return ""
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) ? grouper.format(n) : raw
}

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  placeholder,
  hint,
  min = 0,
  step,
  thousands = false,
}: NumberFieldProps) {
  const id = useId()

  const inputProps = thousands
    ? {
        type: "text" as const,
        inputMode: "numeric" as const,
        value: withCommas(value),
        // Strip everything except digits so state stays a clean number string.
        onChange: (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value.replace(/[^\d]/g, "")),
      }
    : {
        type: "number" as const,
        inputMode: "decimal" as const,
        min,
        step,
        value,
        onChange: (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
      }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex items-stretch overflow-hidden rounded-lg border border-input bg-card focus-within:ring-2 focus-within:ring-ring/40">
        <input
          id={id}
          placeholder={placeholder}
          {...inputProps}
          className="w-full bg-transparent px-3 py-2.5 font-mono text-base tabular-nums text-foreground outline-none placeholder:text-muted-foreground/60"
        />
        {suffix ? (
          <span className="flex shrink-0 items-center border-l border-input bg-muted px-3 text-sm text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
