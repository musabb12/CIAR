"use client"

import { motion } from "framer-motion"
import { ScanFace, Sparkles, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFashionFittingLauncher } from "@/lib/virtual-fitting/use-fashion-fitting-launcher"

type FittingRoomPromoProps = {
  isAr: boolean
  variant?: "hero" | "inline"
}

export function FittingRoomPromo({ isAr, variant = "hero" }: FittingRoomPromoProps) {
  const { launchFashionFittingRoom, loading } = useFashionFittingLauncher()

  if (variant === "inline") {
    return (
      <Button
        type="button"
        variant="outline"
        className="rounded-full gap-2 border-[oklch(0.78_0.14_82/35%)] bg-[oklch(0.78_0.14_82/8%)]"
        disabled={loading}
        onClick={() => void launchFashionFittingRoom()}
      >
        <ScanFace className="h-4 w-4 text-[oklch(0.78_0.14_82)]" />
        {isAr ? "غرفة القياس الافتراضية" : "Virtual fitting room"}
      </Button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-2xl border border-[oklch(0.78_0.14_82/30%)] bg-card p-5 sm:p-6 text-start shadow-md"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.78_0.14_82/30%)] bg-[oklch(0.78_0.14_82/10%)] px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-[oklch(0.78_0.14_82)]" />
            {isAr ? "ذكاء اصطناعي" : "Powered by AI"}
          </div>
          <h2 className="text-lg font-bold tracking-tight sm:text-xl">
            {isAr ? "غرفة القياس الافتراضية" : "Virtual Fitting Room"}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isAr
              ? "جرّب قطع الأزياء من الإعلانات على جسمك قبل الشراء — ارفع صورتك واختر القطعة."
              : "Try fashion items from ads on your body before you buy — upload your photo and pick a garment."}
          </p>
        </div>
        <Button
          type="button"
          className="btn-gold shrink-0 rounded-full gap-2 px-6 h-11"
          disabled={loading}
          onClick={() => void launchFashionFittingRoom()}
        >
          <Wand2 className="h-4 w-4" />
          {loading
            ? isAr
              ? "جاري الفتح…"
              : "Opening…"
            : isAr
              ? "ابدأ القياس الآن"
              : "Start try-on"}
        </Button>
      </div>
    </motion.div>
  )
}
