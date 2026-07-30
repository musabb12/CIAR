"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Loader2, Ruler, ScanFace, Sparkles, Wand2, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useFittingRoom } from "@/lib/fitting-room-context"
import { useI18n } from "@/lib/i18n-context"
import { cn } from "@/lib/utils"
import { GarmentSelector } from "@/components/fitting-room/GarmentSelector"
import { ResultPreview } from "@/components/fitting-room/ResultPreview"
import { UserInputPanel } from "@/components/fitting-room/UserInputPanel"

function ProcessingPanel({
  progress,
  isAr,
  inputMode,
}: {
  progress: number
  isAr: boolean
  inputMode: "photo" | "measurements"
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="relative mb-8">
        <div className="absolute inset-0 animate-ping rounded-full bg-[oklch(0.78_0.14_82/20%)]" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.78_0.14_82/30%)] to-[oklch(0.72_0.12_75/15%)] ring-2 ring-[oklch(0.78_0.14_82/40%)]">
          <Wand2 className="h-9 w-9 text-[oklch(0.82_0.145_85)] animate-pulse" />
        </div>
      </div>

      <p className="text-lg font-semibold">
        {isAr ? "جاري إنشاء القياس الافتراضي…" : "Creating your virtual fit…"}
      </p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {inputMode === "measurements"
          ? isAr
            ? "نحلل قياساتك ونقترح المقاس المناسب — قد يستغرق ذلك لحظات"
            : "Analyzing your measurements to suggest the best fit — this may take a moment"
          : isAr
            ? "الذكاء الاصطناعي يدمج قطعة الملابس مع صورتك — قد يستغرق ذلك لحظات"
            : "AI is blending the garment with your photo — this may take a moment"}
      </p>

      <div className="mt-8 w-full max-w-md">
        <div className="relative h-2 overflow-hidden rounded-full bg-muted/50">
          <motion.div
            className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-r from-[oklch(0.78_0.14_82)] via-[oklch(0.82_0.145_85)] to-[oklch(0.72_0.12_75)] shadow-[0_0_20px_oklch(0.78_0.14_82/50%)]"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut", duration: 0.4 }}
          />
        </div>
        <p className="mt-2 text-xs tabular-nums text-muted-foreground">{Math.round(progress)}%</p>
      </div>
    </motion.div>
  )
}

function StudioSkeleton({ isAr }: { isAr: boolean }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2 animate-pulse">
      <div className="rounded-2xl bg-muted/30 h-[320px]" />
      <div className="space-y-3">
        <div className="h-4 w-32 rounded bg-muted/40" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 w-[140px] rounded-2xl bg-muted/30" />
          ))}
        </div>
        <p className="text-xs text-muted-foreground pt-4">{isAr ? "جاري التحميل…" : "Loading…"}</p>
      </div>
    </div>
  )
}

export function FittingRoomModal() {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const {
    isOpen,
    closeFittingRoom,
    resetFittingRoom,
    garments,
    selectedGarment,
    selectGarment,
    userImage,
    setUserImage,
    inputMode,
    setInputMode,
    bodyMeasurements,
    setBodyMeasurements,
    measurementErrors,
    roomConfig,
    status,
    progress,
    result,
    error,
    runTryOn,
  } = useFittingRoom()

  const isProcessing = status === "uploading" || status === "processing"
  const showResult = status === "completed" && result
  const canStart =
    selectedGarment &&
    (inputMode === "photo" ? Boolean(userImage) : roomConfig.allowMeasurements)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeFittingRoom()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "fitting-room-dialog max-w-[min(1100px,calc(100vw-1rem))] gap-0 overflow-hidden border-border p-0",
          "bg-background shadow-2xl",
          "sm:max-w-[min(1100px,calc(100vw-2rem))] max-h-[min(92vh,900px)]"
        )}
      >
        <div className="relative flex max-h-[min(92vh,900px)] flex-col bg-background">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-background px-5 py-4 sm:px-6">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full border-[oklch(0.78_0.14_82/35%)] bg-[oklch(0.78_0.14_82/8%)]">
                  <Sparkles className="me-1 h-3 w-3" />
                  AI
                </Badge>
                <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight">
                  {isAr ? "غرفة القياس الافتراضية" : "Virtual Fitting Room"}
                </DialogTitle>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                {isAr
                  ? "ارفع صورتك أو أدخل قياساتك، اختر قطعة أزياء، وشاهد النتيجة"
                  : "Upload your photo or enter measurements, pick a garment, and preview the result"}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full"
              onClick={closeFittingRoom}
            >
              <X className="h-5 w-5" />
            </Button>
          </header>

          <div className="flex-1 overflow-y-auto bg-background px-5 py-5 sm:px-6 sm:py-6">
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <ProcessingPanel key="processing" progress={progress} isAr={isAr} inputMode={inputMode} />
              ) : showResult && result ? (
                <ResultPreview
                  key="result"
                  result={result}
                  userImage={userImage}
                  garment={selectedGarment}
                  isAr={isAr}
                  onRetry={resetFittingRoom}
                />
              ) : garments.length === 0 ? (
                <StudioSkeleton key="loading" isAr={isAr} />
              ) : (
                <motion.div
                  key="studio"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid gap-6 lg:grid-cols-2 lg:gap-8"
                >
                  <UserInputPanel
                    mode={inputMode}
                    onModeChange={setInputMode}
                    allowPhotoUpload={roomConfig.allowPhotoUpload}
                    allowMeasurements={roomConfig.allowMeasurements}
                    measurementFields={roomConfig.measurementFields}
                    userImage={userImage}
                    onUserImageChange={setUserImage}
                    measurements={bodyMeasurements}
                    onMeasurementsChange={setBodyMeasurements}
                    measurementErrors={measurementErrors}
                    isAr={isAr}
                    disabled={isProcessing}
                  />

                  <div className="space-y-5">
                    <GarmentSelector
                      garments={garments}
                      selectedId={selectedGarment?.id ?? null}
                      onSelect={selectGarment}
                      isAr={isAr}
                      disabled={isProcessing}
                    />

                    {selectedGarment ? (
                      <div className="hidden lg:block overflow-hidden rounded-2xl border border-border/40 bg-card">
                        <div className="relative aspect-[4/5] max-h-[280px] w-full overflow-hidden bg-muted">
                          <img
                            src={selectedGarment.imageUrl}
                            alt={selectedGarment.title}
                            className="absolute inset-0 h-full w-full object-cover object-center"
                          />
                        </div>
                        <div className="p-3 space-y-1">
                          <p className="text-sm font-semibold">{selectedGarment.title}</p>
                          {selectedGarment.colors?.length ? (
                            <p className="text-xs text-muted-foreground">
                              {isAr ? "الألوان:" : "Colors:"} {selectedGarment.colors.join(", ")}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && status === "error" ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </motion.div>
            ) : null}

            {error && status !== "error" ? (
              <p className="mt-3 text-xs text-destructive">{error}</p>
            ) : null}
          </div>

          {!showResult && !isProcessing && garments.length > 0 ? (
            <footer className="shrink-0 border-t border-border bg-background px-5 py-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                {inputMode === "measurements" ? (
                  <>
                    <Ruler className="h-3.5 w-3.5" />
                    {isAr ? "أدخل قياساتك بدقة للحصول على توصية مقاس أدق" : "Enter accurate measurements for a better size recommendation"}
                  </>
                ) : (
                  <>
                    <ScanFace className="h-3.5 w-3.5" />
                    {isAr ? "صورة واضحة للجسم كاملاً تعطي أفضل نتيجة" : "A clear full-body photo gives the best result"}
                  </>
                )}
              </p>
              <Button
                type="button"
                className="btn-gold rounded-full gap-2 min-w-[160px]"
                disabled={!canStart}
                onClick={() => void runTryOn(isAr)}
              >
                <Wand2 className="h-4 w-4" />
                {isAr ? "ابدأ القياس الافتراضي" : "Start virtual try-on"}
              </Button>
            </footer>
          ) : null}

          {isProcessing ? (
            <footer className="shrink-0 border-t border-border bg-background px-5 py-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {isAr ? "لا تغلق النافذة أثناء المعالجة" : "Please keep this window open while processing"}
            </footer>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
