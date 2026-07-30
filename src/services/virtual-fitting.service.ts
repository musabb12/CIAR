import type { TryOnRequest, TryOnResult } from "@/lib/virtual-fitting/types"
import {
  formatMeasurementsSummary,
  recommendGarmentSize,
} from "@/lib/virtual-fitting/size-recommendation"
import { resolvePublicFittingGarments } from "@/services/fitting-room.service"

export type FittingProvider = "mock" | "fashn" | "replicate"

const DEFAULT_PROVIDER: FittingProvider =
  (process.env.VIRTUAL_FITTING_PROVIDER as FittingProvider) || "mock"

const FASHN_API_KEY = process.env.FASHN_API_KEY
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN

function dataUrl(mimeType: string, base64: string): string {
  return `data:${mimeType};base64,${base64}`
}

async function delay(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

async function runMockTryOn(input: TryOnRequest, garmentSizes: string[] = []): Promise<TryOnResult> {
  const started = Date.now()
  await delay(1800 + Math.random() * 1200)

  if (input.inputMode === "measurements" && input.bodyMeasurements) {
    const isAr = input.locale === "ar"
    const { size, notes } = recommendGarmentSize(input.bodyMeasurements, garmentSizes)
    return {
      resultImageUrl: input.garmentImageUrl,
      provider: "mock",
      processingMs: Date.now() - started,
      mock: true,
      inputMode: "measurements",
      sizeRecommendation: size,
      fitNotes: notes,
      measurementsSummary: formatMeasurementsSummary(input.bodyMeasurements, isAr),
    }
  }

  return {
    resultImageUrl: dataUrl(input.userImageMimeType || "image/jpeg", input.userImageBase64 || ""),
    provider: "mock",
    processingMs: Date.now() - started,
    mock: true,
    inputMode: "photo",
  }
}

async function runFashnTryOn(input: TryOnRequest): Promise<TryOnResult> {
  if (!FASHN_API_KEY) {
    throw new Error("FASHN_API_KEY not configured")
  }
  if (!input.userImageBase64 || !input.userImageMimeType) {
    throw new Error("Photo required for Fashn provider")
  }

  const started = Date.now()
  const userPhoto = dataUrl(input.userImageMimeType, input.userImageBase64)

  const res = await fetch("https://api.fashn.ai/v1/run", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FASHN_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_image: userPhoto,
      garment_image: input.garmentImageUrl,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Fashn API error: ${res.status} ${text.slice(0, 200)}`)
  }

  const json = (await res.json()) as { output?: string; result_url?: string; image?: string }
  const resultImageUrl = json.output || json.result_url || json.image
  if (!resultImageUrl) throw new Error("Fashn API returned no image")

  return {
    resultImageUrl,
    provider: "fashn",
    processingMs: Date.now() - started,
  }
}

async function runReplicateTryOn(input: TryOnRequest): Promise<TryOnResult> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN not configured")
  }
  if (!input.userImageBase64 || !input.userImageMimeType) {
    throw new Error("Photo required for Replicate provider")
  }

  const started = Date.now()
  const model =
    process.env.REPLICATE_TRYON_MODEL ||
    "cuuupid/idm-vton:906425dbca90663ff5427624839572cc583ea6176d927279d083f7538083604"

  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: model.includes(":") ? model.split(":")[1] : undefined,
      input: {
        human_img: dataUrl(input.userImageMimeType, input.userImageBase64),
        garm_img: input.garmentImageUrl,
        garment_des: input.garmentId,
      },
    }),
  })

  if (!createRes.ok) {
    throw new Error(`Replicate create failed: ${createRes.status}`)
  }

  const prediction = (await createRes.json()) as {
    id: string
    status: string
    output?: string | string[]
    error?: string
  }

  let status = prediction.status
  let output = prediction.output
  let attempts = 0

  while (status !== "succeeded" && status !== "failed" && status !== "canceled" && attempts < 60) {
    await delay(2000)
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` },
    })
    if (!pollRes.ok) throw new Error("Replicate poll failed")
    const polled = (await pollRes.json()) as typeof prediction
    status = polled.status
    output = polled.output
    if (polled.error) throw new Error(polled.error)
    attempts++
  }

  if (status !== "succeeded") throw new Error(`Replicate ended with status: ${status}`)

  const resultImageUrl = Array.isArray(output) ? output[0] : output
  if (!resultImageUrl) throw new Error("Replicate returned no output")

  return {
    resultImageUrl,
    provider: "replicate",
    processingMs: Date.now() - started,
  }
}

export async function processVirtualTryOn(input: TryOnRequest): Promise<TryOnResult> {
  const provider = DEFAULT_PROVIDER
  let garmentSizes: string[] = []
  try {
    const { garments } = await resolvePublicFittingGarments(input.locale)
    garmentSizes = garments.find((g) => g.id === input.garmentId)?.sizes || []
  } catch {
    garmentSizes = []
  }

  if (input.inputMode === "measurements") {
    return runMockTryOn(input, garmentSizes)
  }

  switch (provider) {
    case "fashn":
      try {
        return await runFashnTryOn(input)
      } catch {
        return runMockTryOn(input, garmentSizes)
      }
    case "replicate":
      try {
        return await runReplicateTryOn(input)
      } catch {
        return runMockTryOn(input, garmentSizes)
      }
    case "mock":
    default:
      return runMockTryOn(input, garmentSizes)
  }
}

export function getVirtualFittingProvider(): FittingProvider {
  return DEFAULT_PROVIDER
}
