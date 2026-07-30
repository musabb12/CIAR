import { NextRequest } from "next/server"
import { z } from "zod"
import { fail, ok } from "@/lib/api-response"
import { processVirtualTryOn } from "@/services/virtual-fitting.service"

const tryOnSchema = z
  .object({
    inputMode: z.enum(["photo", "measurements"]),
    garmentImageUrl: z.string().url().max(2000),
    garmentId: z.string().min(1).max(120),
    locale: z.string().max(10).optional(),
    userImageBase64: z.string().max(15_000_000).optional(),
    userImageMimeType: z.enum(["image/jpeg", "image/png", "image/webp"]).optional(),
    bodyMeasurements: z.record(z.union([z.string().max(200), z.number()])).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.inputMode === "photo") {
      if (!data.userImageBase64 || data.userImageBase64.length < 100) {
        ctx.addIssue({ code: "custom", message: "Photo is required", path: ["userImageBase64"] })
      }
      if (!data.userImageMimeType) {
        ctx.addIssue({ code: "custom", message: "Photo mime type is required", path: ["userImageMimeType"] })
      }
    }
    if (data.inputMode === "measurements") {
      const values = Object.values(data.bodyMeasurements || {})
      if (values.every((v) => String(v).trim() === "")) {
        ctx.addIssue({ code: "custom", message: "Measurements are required", path: ["bodyMeasurements"] })
      }
    }
  })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = tryOnSchema.safeParse(body)
    if (!parsed.success) {
      return fail("Invalid request payload", 400)
    }

    const result = await processVirtualTryOn(parsed.data)
    return ok(result)
  } catch (error) {
    console.error("POST /api/fitting-room error:", error)
    return fail(error instanceof Error ? error.message : "Try-on failed", 500)
  }
}

export async function GET() {
  const { getVirtualFittingProvider } = await import("@/services/virtual-fitting.service")
  return ok({ provider: getVirtualFittingProvider() })
}
