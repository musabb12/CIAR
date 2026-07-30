import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { fittingRoomConfigSchema } from "@/lib/fitting-room-config"
import { getFittingRoomConfig, saveFittingRoomConfig } from "@/services/fitting-room.service"

export async function GET() {
  try {
    const config = await getFittingRoomConfig()
    return NextResponse.json({ config })
  } catch (error) {
    console.error("GET /api/admin/fitting-room error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = fittingRoomConfigSchema.safeParse(body.config)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 })
    }
    const config = await saveFittingRoomConfig(parsed.data)
    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error("POST /api/admin/fitting-room error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
