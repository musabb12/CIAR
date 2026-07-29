"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CURRENCIES, countryCodeToFlagEmoji } from "@/lib/currency-context"
import { cn } from "@/lib/utils"

type CurrencySelectProps = {
  value?: string
  onChange: (code: string) => void
  isAr?: boolean
  className?: string
}

function resolveCurrency(code?: string) {
  return CURRENCIES.find((item) => item.code === code) || CURRENCIES.find((item) => item.code === "SAR")!
}

function CurrencyOption({ code, isAr }: { code: string; isAr: boolean }) {
  const currency = resolveCurrency(code)
  return (
    <span className="flex items-center gap-2">
      <span className="text-base leading-none" aria-hidden>
        {countryCodeToFlagEmoji(currency.flag)}
      </span>
      <span className="truncate">{isAr ? currency.nameAr : currency.name}</span>
      <span className="font-mono text-xs text-muted-foreground">{currency.code}</span>
    </span>
  )
}

export function CurrencySelect({ value, onChange, isAr = false, className }: CurrencySelectProps) {
  const selectedCode = CURRENCIES.some((item) => item.code === value) ? value || "SAR" : "SAR"

  return (
    <Select value={selectedCode} onValueChange={onChange}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={isAr ? "اختر العملة" : "Select currency"} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {CURRENCIES.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <CurrencyOption code={currency.code} isAr={isAr} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
