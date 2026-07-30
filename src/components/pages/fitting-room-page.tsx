"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { Loader2, ScanFace, Shirt, Sparkles, Upload, Wand2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n-context"
import { FittingRoomPromo } from "@/components/fitting-room/FittingRoomPromo"
import { useFittingRoom } from "@/lib/fitting-room-context"
import type { FittingGarment } from "@/lib/virtual-fitting/types"

const STEPS = [
  {
    icon: Upload,
    titleAr: "ارفع صورتك أو أدخل قياساتك",
    titleEn: "Upload a photo or enter measurements",
    descAr: "اختر الطريقة الأنسب لك — صورة أو قياسات الجسم",
    descEn: "Choose what works best — photo or body measurements",
  },
  {
    icon: Shirt,
    titleAr: "اختر قطعة الأزياء",
    titleEn: "Pick a garment",
    descAr: "من قطع غرفة القياس أو إعلانات الأزياء",
    descEn: "From the fitting room catalog or fashion ads",
  },
  {
    icon: Wand2,
    titleAr: "شاهد النتيجة",
    titleEn: "See the result",
    descAr: "معاينة فورية أو توصية مقاس بالذكاء الاصطناعي",
    descEn: "Instant preview or AI size recommendation",
  },
]

type RoomConfig = {
  enabled: boolean
  pageTitleAr: string
  pageTitleEn: string
  pageSubtitleAr: string
  pageSubtitleEn: string
  garments: FittingGarment[]
}

export function FittingRoomPage() {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const { openFittingRoom } = useFittingRoom()
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" })
  const [room, setRoom] = useState<RoomConfig>({
    enabled: true,
    pageTitleAr: "",
    pageTitleEn: "",
    pageSubtitleAr: "",
    pageSubtitleEn: "",
    garments: [],
  })
  const [loading, setLoading] = useState(true)

  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/fitting-room/config?locale=${locale}`, { cache: "no-store" })
      const data = await res.json()
      setRoom({
        enabled: data.enabled !== false,
        pageTitleAr: data.pageTitleAr || "",
        pageTitleEn: data.pageTitleEn || "",
        pageSubtitleAr: data.pageSubtitleAr || "",
        pageSubtitleEn: data.pageSubtitleEn || "",
        garments: Array.isArray(data.garments) ? data.garments : [],
      })
    } catch {
      setRoom((prev) => ({ ...prev, garments: [] }))
    } finally {
      setLoading(false)
    }
  }, [locale])

  useEffect(() => {
    void loadConfig()
  }, [loadConfig])

  const pageTitle =
    (isAr ? room.pageTitleAr : room.pageTitleEn) ||
    t("fitting_room.page_title") ||
    (isAr ? "غرفة القياس الافتراضية" : "Virtual Fitting Room")

  const pageSubtitle =
    (isAr ? room.pageSubtitleAr : room.pageSubtitleEn) ||
    t("fitting_room.page_subtitle") ||
    (isAr
      ? "جرّب قطع الأزياء على جسمك — ارفع صورتك أو أدخل قياساتك"
      : "Try fashion pieces — upload your photo or enter your measurements")

  const openForGarment = (garmentId: string) => {
    if (room.garments.length === 0) return
    openFittingRoom({ garments: room.garments, initialGarmentId: garmentId })
  }

  if (!loading && !room.enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-muted-foreground text-center">
          {isAr ? "غرفة القياس غير متاحة حالياً" : "The fitting room is currently unavailable"}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-[oklch(0.78_0.14_82/10%)] to-background">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -end-24 h-64 w-64 rounded-full bg-[oklch(0.78_0.14_82/12%)] blur-3xl" />
          <div className="absolute -bottom-32 -start-16 h-72 w-72 rounded-full bg-[oklch(0.72_0.12_75/10%)] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <motion.div
            ref={headerRef}
            initial={{ opacity: 0, y: 24 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge className="mb-4 rounded-full border-[oklch(0.78_0.14_82/35%)] bg-[oklch(0.78_0.14_82/12%)] text-[oklch(0.78_0.14_82)]">
              <Sparkles className="me-1.5 h-3.5 w-3.5" />
              {t("fitting_room.page_badge") || (isAr ? "ذكاء اصطناعي" : "AI powered")}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">{pageTitle}</h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">{pageSubtitle}</p>
            <FittingRoomPromo isAr={isAr} />
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.titleEn}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className="rounded-2xl border border-border/50 bg-card/60 p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[oklch(0.78_0.14_82/12%)]">
                <step.icon className="h-5 w-5 text-[oklch(0.78_0.14_82)]" />
              </div>
              <h2 className="font-semibold">{isAr ? step.titleAr : step.titleEn}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{isAr ? step.descAr : step.descEn}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold">
            {t("fitting_room.garments_title") || (isAr ? "قطع أزياء للتجربة" : "Garments to try on")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("fitting_room.garments_subtitle") ||
              (isAr ? "اختر قطعة وابدأ القياس الافتراضي" : "Pick a piece and start virtual try-on")}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : room.garments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 py-16 text-center text-muted-foreground">
            {isAr ? "لا توجد قطع أزياء متاحة حالياً" : "No fashion items available yet"}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {room.garments.map((garment) => (
              <article
                key={garment.id}
                className="group overflow-hidden rounded-2xl border border-[oklch(0.78_0.14_82/20%)] bg-gradient-to-b from-[oklch(0.78_0.14_82/6%)] to-transparent shadow-sm transition hover:shadow-md"
              >
                {garment.imageUrl ? (
                  <div className="aspect-[4/5] overflow-hidden bg-muted">
                    <img
                      src={garment.imageUrl}
                      alt={garment.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : null}
                <div className="p-5">
                  {garment.companyName || garment.brand ? (
                    <p className="text-xs text-muted-foreground">{garment.companyName || garment.brand}</p>
                  ) : null}
                  <h3 className="mt-1 text-lg font-bold">{garment.title}</h3>
                  {garment.sizes?.length ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isAr ? "المقاسات:" : "Sizes:"} {garment.sizes.join(", ")}
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    className="mt-4 w-full rounded-xl btn-gold gap-2"
                    onClick={() => openForGarment(garment.id)}
                  >
                    <ScanFace className="h-4 w-4" />
                    {isAr ? "جرّب القياس" : "Try on"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
