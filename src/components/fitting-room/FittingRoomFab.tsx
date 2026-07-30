"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ScanFace, Sparkles } from "lucide-react"
import { useI18n } from "@/lib/i18n-context"
import { useRouter } from "@/lib/router-context"
import { useFashionFittingLauncher } from "@/lib/virtual-fitting/use-fashion-fitting-launcher"
import { cn } from "@/lib/utils"

/** Floating try-on button — shown on the fitting room page, stacked above the AI assistant FAB. */
export function FittingRoomFab() {
  const { locale } = useI18n()
  const { route } = useRouter()
  const isAr = locale === "ar"
  const { launchFashionFittingRoom, loading } = useFashionFittingLauncher()
  const [aiChatEnabled, setAiChatEnabled] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch("/api/ai/settings")
        const data = await res.json()
        if (!cancelled) setAiChatEnabled(Boolean(data.settings?.chatEnabled))
      } catch {
        if (!cancelled) setAiChatEnabled(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (route.page !== "fitting-room") return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={cn(
        "pointer-events-none fixed start-5 z-[61] flex flex-col items-start group",
        aiChatEnabled ? "bottom-[5.75rem]" : "bottom-5"
      )}
    >
      <button
        type="button"
        disabled={loading}
        onClick={() => void launchFashionFittingRoom()}
        className={cn(
          "pointer-events-auto group relative flex h-14 w-14 items-center justify-center rounded-full",
          "bg-gradient-to-br from-[oklch(0.78_0.14_82)] via-[oklch(0.82_0.145_85)] to-[oklch(0.72_0.12_75)]",
          "text-[oklch(0.15_0.04_80)] shadow-[0_0_28px_oklch(0.78_0.14_82/45%)] ring-2 ring-white/20",
          "transition hover:scale-105 hover:shadow-[0_0_36px_oklch(0.78_0.14_82/55%)]",
          "disabled:opacity-70 disabled:pointer-events-none",
          "dark:ring-white/10"
        )}
        aria-label={isAr ? "غرفة القياس الافتراضية بالذكاء الاصطناعي" : "AI virtual fitting room"}
      >
        <span className="absolute inset-0 rounded-full bg-[oklch(0.78_0.14_82/25%)] blur-md opacity-0 transition group-hover:opacity-100" />
        <ScanFace className="relative h-6 w-6" />
        <span className="absolute -top-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-md ring-1 ring-[oklch(0.78_0.14_82/40%)]">
          <Sparkles className="h-3 w-3 text-[oklch(0.78_0.14_82)]" />
        </span>
      </button>

      <span
        className={cn(
          "pointer-events-none mt-2 max-w-[140px] rounded-xl border border-[oklch(0.78_0.14_82/25%)]",
          "bg-background/90 px-2.5 py-1.5 text-[10px] font-semibold leading-tight text-foreground shadow-lg backdrop-blur-md",
          "opacity-0 translate-y-1 transition group-hover:opacity-100 sm:opacity-100 sm:translate-y-0"
        )}
      >
        {isAr ? "قياس افتراضي · AI" : "Virtual fit · AI"}
      </span>
    </motion.div>
  )
}
