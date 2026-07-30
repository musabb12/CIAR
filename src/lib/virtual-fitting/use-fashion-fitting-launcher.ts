"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n-context"
import { useFittingRoom } from "@/lib/fitting-room-context"
import type { FittingGarment } from "@/lib/virtual-fitting/types"

export function useFashionFittingLauncher() {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const { openFittingRoom } = useFittingRoom()
  const [loading, setLoading] = useState(false)

  const launchFashionFittingRoom = useCallback(
    async (initialGarmentId?: string) => {
      setLoading(true)
      try {
        const res = await fetch(`/api/fitting-room/config?locale=${locale}`, { cache: "no-store" })
        const data = await res.json().catch(() => ({}))
        const garments: FittingGarment[] = Array.isArray(data.garments) ? data.garments : []

        if (data.enabled === false) {
          toast.info(isAr ? "غرفة القياس غير متاحة حالياً" : "The fitting room is currently unavailable")
          return false
        }

        if (garments.length === 0) {
          toast.info(
            isAr
              ? "لا توجد قطع أزياء متاحة — أضف قطعاً من لوحة التحكم أو إعلانات الأزياء"
              : "No fashion items available — add garments in admin or publish fashion ads"
          )
          return false
        }

        openFittingRoom({
          garments,
          initialGarmentId:
            initialGarmentId && garments.some((g) => g.id === initialGarmentId)
              ? initialGarmentId
              : undefined,
        })
        return true
      } catch {
        toast.error(isAr ? "تعذّر فتح غرفة القياس" : "Could not open fitting room")
        return false
      } finally {
        setLoading(false)
      }
    },
    [isAr, locale, openFittingRoom]
  )

  return { launchFashionFittingRoom, loading }
}
