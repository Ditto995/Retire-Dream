"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { Page1State, Page2State } from "@/lib/calc"

interface RetirementContextValue {
  page1: Page1State
  page2: Page2State
  setPage1: <K extends keyof Page1State>(key: K, value: Page1State[K]) => void
  setPage2Category: (
    category: "growth" | "dividend" | "balanced",
    field: "amount" | "returnRate",
    value: string,
  ) => void
  setSip: (field: "aReturn" | "bReturn" | "allocationA", value: string) => void
}

const defaultPage1: Page1State = {
  yearsToRetirement: "25",
  monthlyIncome: "60000",
  considerInflation: true,
  inflationRate: "2.5",
  includePension: false,
  monthlyPension: "20000",
  method: "rule4",
  withdrawalRate: "4",
  retirementDuration: "30",
  retirementReturn: "4",
}

const defaultPage2: Page2State = {
  growth: { amount: "1000000", returnRate: "9.0" },
  dividend: { amount: "500000", returnRate: "6.5" },
  balanced: { amount: "300000", returnRate: "4.0" },
  sip: { aReturn: "9.0", bReturn: "4.0", allocationA: "50" },
}

const RetirementContext = createContext<RetirementContextValue | null>(null)

export function RetirementProvider({ children }: { children: ReactNode }) {
  const [page1, setPage1State] = useState<Page1State>(defaultPage1)
  const [page2, setPage2State] = useState<Page2State>(defaultPage2)

  const setPage1: RetirementContextValue["setPage1"] = (key, value) => {
    setPage1State((prev) => ({ ...prev, [key]: value }))
  }

  const setPage2Category: RetirementContextValue["setPage2Category"] = (category, field, value) => {
    setPage2State((prev) => ({
      ...prev,
      [category]: { ...prev[category], [field]: value },
    }))
  }

  const setSip: RetirementContextValue["setSip"] = (field, value) => {
    setPage2State((prev) => ({ ...prev, sip: { ...prev.sip, [field]: value } }))
  }

  return (
    <RetirementContext.Provider value={{ page1, page2, setPage1, setPage2Category, setSip }}>
      {children}
    </RetirementContext.Provider>
  )
}

export function useRetirement() {
  const ctx = useContext(RetirementContext)
  if (!ctx) {
    throw new Error("useRetirement must be used within a RetirementProvider")
  }
  return ctx
}
