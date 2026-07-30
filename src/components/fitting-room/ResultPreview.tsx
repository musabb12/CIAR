"use client"

import { motion } from "framer-motion"
import { Download, RefreshCw, Ruler, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { FittingGarment, TryOnResult, UserImageState } from "@/lib/virtual-fitting/types"

type ResultPreviewProps = {
  result: TryOnResult
  userImage: UserImageState | null
  garment: FittingGarment | null
  isAr: boolean
  onRetry: () => void
}

export function ResultPreview({ result, userImage, garment, isAr, onRetry }: ResultPreviewProps) {
  const download = async () => {
    try {
      const res = await fetch(result.resultImageUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `ciar-tryon-${Date.now()}.jpg`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(result.resultImageUrl, "_blank")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[oklch(0.78_0.14_82)]" />
          <p className="font-semibold">{isAr ? "نتيجة القياس الافتراضي" : "Virtual try-on result"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {result.mock ? (
            <Badge variant="outline" className="rounded-full">
              {isAr ? "وضع تجريبي" : "Demo mode"}
            </Badge>
          ) : null}
          <Badge variant="secondary" className="rounded-full">
            {result.provider}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-[oklch(0.78_0.14_82/25%)] bg-black/10 shadow-[0_0_40px_oklch(0.78_0.14_82/10%)]">
          <div className="aspect-[3/4] max-h-[480px] w-full">
            <img
              src={result.resultImageUrl}
              alt={isAr ? "النتيجة" : "Result"}
              className="h-full w-full object-cover object-top"
            />
          </div>
          {result.mock && garment ? (
            <div className="absolute end-3 bottom-3 w-20 overflow-hidden rounded-xl border border-white/20 shadow-lg">
              <img src={garment.imageUrl} alt="" className="aspect-square w-full object-cover" />
            </div>
          ) : null}
        </div>

        <div className="space-y-4 rounded-2xl border border-border/40 bg-card p-4">
          {garment ? (
            <div>
              <p className="text-xs text-muted-foreground">{isAr ? "القطعة" : "Garment"}</p>
              <p className="font-semibold">{garment.title}</p>
              {garment.sizes?.length ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {isAr ? "المقاسات:" : "Sizes:"} {garment.sizes.join(", ")}
                </p>
              ) : null}
            </div>
          ) : null}

          {result.inputMode === "measurements" && result.sizeRecommendation ? (
            <div className="rounded-xl border border-[oklch(0.78_0.14_82/25%)] bg-[oklch(0.78_0.14_82/8%)] p-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Ruler className="h-3.5 w-3.5" />
                {isAr ? "توصية المقاس" : "Size recommendation"}
              </p>
              <p className="mt-1 text-2xl font-bold">{result.sizeRecommendation}</p>
              {result.fitNotes ? (
                <p className="mt-2 text-xs text-muted-foreground">{result.fitNotes}</p>
              ) : null}
            </div>
          ) : null}

          {result.measurementsSummary ? (
            <div>
              <p className="text-xs text-muted-foreground mb-1">{isAr ? "القياسات المدخلة" : "Entered measurements"}</p>
              <p className="text-sm">{result.measurementsSummary}</p>
            </div>
          ) : null}

          {userImage ? (
            <div>
              <p className="text-xs text-muted-foreground mb-2">{isAr ? "صورتك الأصلية" : "Your original photo"}</p>
              <img
                src={userImage.previewUrl}
                alt=""
                className="h-32 w-24 rounded-xl object-cover object-top border border-border/40"
              />
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">
            {isAr ? "وقت المعالجة:" : "Processing time:"}{" "}
            {(result.processingMs / 1000).toFixed(1)}s
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" className="btn-gold rounded-full gap-2" onClick={() => void download()}>
              <Download className="h-4 w-4" />
              {isAr ? "تحميل" : "Download"}
            </Button>
            <Button type="button" variant="outline" className="rounded-full gap-2" onClick={onRetry}>
              <RefreshCw className="h-4 w-4" />
              {isAr ? "قياس جديد" : "Try again"}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
