import { NextResponse } from "next/server"
import { resolvePublicFittingGarments } from "@/services/fitting-room.service"

export const dynamic = "force-dynamic"

const NO_STORE = { "Cache-Control": "no-store, no-cache, must-revalidate" }

export async function GET(request: Request) {
  try {
    const locale = new URL(request.url).searchParams.get("locale") || undefined
    const { config, garments } = await resolvePublicFittingGarments(locale || undefined)
    return NextResponse.json(
      {
        enabled: config.enabled,
        allowPhotoUpload: config.allowPhotoUpload,
        allowMeasurements: config.allowMeasurements,
        pageTitleAr: config.pageTitleAr,
        pageTitleEn: config.pageTitleEn,
        pageSubtitleAr: config.pageSubtitleAr,
        pageSubtitleEn: config.pageSubtitleEn,
        measurementFields: config.measurementFields.filter((f) => f.enabled),
        garments,
      },
      { headers: NO_STORE }
    )
  } catch (error) {
    console.error("GET /api/fitting-room/config error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: NO_STORE })
  }
}
