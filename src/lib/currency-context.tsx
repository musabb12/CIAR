"use client"

import React, { createContext, useContext, useState, useCallback } from "react"

interface Currency {
  code: string
  name: string
  nameAr: string
  flag: string
  symbol: string
}

export function countryCodeToFlagEmoji(code: string): string {
  if (code === "EU") return "🇪🇺"
  const upper = code.toUpperCase()
  if (upper.length !== 2) return "🏳️"
  return String.fromCodePoint(
    ...upper.split("").map((char) => 0x1f1e6 + char.charCodeAt(0) - 65)
  )
}

export const CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar", nameAr: "الدولار الأمريكي", flag: "US", symbol: "$" },
  { code: "EUR", name: "Euro", nameAr: "اليورو", flag: "EU", symbol: "€" },
  { code: "GBP", name: "British Pound", nameAr: "الجنيه الإسترليني", flag: "GB", symbol: "£" },
  { code: "SAR", name: "Saudi Riyal", nameAr: "الريال السعودي", flag: "SA", symbol: "ر.س" },
  { code: "QAR", name: "Qatari Riyal", nameAr: "الريال القطري", flag: "QA", symbol: "ر.ق" },
  { code: "AED", name: "UAE Dirham", nameAr: "الدرهم الإماراتي", flag: "AE", symbol: "د.إ" },
  { code: "KWD", name: "Kuwaiti Dinar", nameAr: "الدينار الكويتي", flag: "KW", symbol: "د.ك" },
  { code: "BHD", name: "Bahraini Dinar", nameAr: "الدينار البحريني", flag: "BH", symbol: "د.ب" },
  { code: "OMR", name: "Omani Rial", nameAr: "الريال العُماني", flag: "OM", symbol: "ر.ع" },
  { code: "EGP", name: "Egyptian Pound", nameAr: "الجنيه المصري", flag: "EG", symbol: "ج.م" },
  { code: "JOD", name: "Jordanian Dinar", nameAr: "الدينار الأردني", flag: "JO", symbol: "د.أ" },
  { code: "LBP", name: "Lebanese Pound", nameAr: "الليرة اللبنانية", flag: "LB", symbol: "ل.ل" },
  { code: "SYP", name: "Syrian Pound", nameAr: "الليرة السورية", flag: "SY", symbol: "ل.س" },
  { code: "SDG", name: "Sudanese Pound", nameAr: "الجنيه السوداني", flag: "SD", symbol: "ج.س" },
  { code: "TRY", name: "Turkish Lira", nameAr: "الليرة التركية", flag: "TR", symbol: "₺" },
  { code: "CNY", name: "Chinese Yuan", nameAr: "اليوان الصيني", flag: "CN", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", nameAr: "الروبية الهندية", flag: "IN", symbol: "₹" },
  { code: "JPY", name: "Japanese Yen", nameAr: "الين الياباني", flag: "JP", symbol: "¥" },
]

interface CurrencyContextType {
  currency: Currency
  setCurrency: (code: string) => void
  formatPrice: (amount: number) => string
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: CURRENCIES[0],
  setCurrency: () => {},
  formatPrice: (n: number) => n.toString(),
})

function getSavedCurrency(): Currency {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("ciar_currency")
    if (saved) {
      const found = CURRENCIES.find((c) => c.code === saved)
      if (found) return found
    }
  }
  return CURRENCIES[0]
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => getSavedCurrency())

  const setCurrency = useCallback((code: string) => {
    const found = CURRENCIES.find((c) => c.code === code)
    if (found) {
      setCurrencyState(found)
      localStorage.setItem("ciar_currency", code)
    }
  }, [])

  const formatPrice = (amount: number) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount)
    } catch {
      return `${currency.symbol}${amount}`
    }
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
