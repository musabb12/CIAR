import { z } from "zod"

export const FITTING_ROOM_CONFIG_KEY = "fitting_room_config_v1"

export type FittingRoomMeasurementField = {
  id: string
  labelAr: string
  labelEn: string
  unit: string
  type: "number" | "text"
  placeholderAr?: string
  placeholderEn?: string
  required: boolean
  enabled: boolean
  min?: number
  max?: number
}

export type FittingRoomGarmentItem = {
  id: string
  titleAr: string
  titleEn: string
  imageUrl: string
  brand?: string
  price?: number
  currency?: string
  sizes: string[]
  colors: string[]
  fabricTypes: string[]
  enabled: boolean
  order: number
  sourceAdId?: string
}

export type FittingRoomConfig = {
  enabled: boolean
  allowPhotoUpload: boolean
  allowMeasurements: boolean
  useFashionAds: boolean
  pageTitleAr: string
  pageTitleEn: string
  pageSubtitleAr: string
  pageSubtitleEn: string
  measurementFields: FittingRoomMeasurementField[]
  garments: FittingRoomGarmentItem[]
}

const measurementFieldSchema = z.object({
  id: z.string().min(1).max(40),
  labelAr: z.string().min(1).max(80),
  labelEn: z.string().min(1).max(80),
  unit: z.string().max(20).default(""),
  type: z.enum(["number", "text"]).default("number"),
  placeholderAr: z.string().max(120).optional(),
  placeholderEn: z.string().max(120).optional(),
  required: z.boolean().default(false),
  enabled: z.boolean().default(true),
  min: z.number().optional(),
  max: z.number().optional(),
})

const garmentSchema = z.object({
  id: z.string().min(1).max(80),
  titleAr: z.string().min(1).max(120),
  titleEn: z.string().min(1).max(120),
  imageUrl: z.string().min(1).max(500),
  brand: z.string().max(80).optional(),
  price: z.coerce.number().min(0).optional(),
  currency: z.string().max(10).optional(),
  sizes: z.array(z.string().max(20)).max(20).default([]),
  colors: z.array(z.string().max(40)).max(20).default([]),
  fabricTypes: z.array(z.string().max(40)).max(20).default([]),
  enabled: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(9999).default(0),
  sourceAdId: z.string().max(80).optional(),
})

export const fittingRoomConfigSchema = z.object({
  enabled: z.boolean().default(true),
  allowPhotoUpload: z.boolean().default(true),
  allowMeasurements: z.boolean().default(true),
  useFashionAds: z.boolean().default(true),
  pageTitleAr: z.string().max(160).default("غرفة القياس الافتراضية"),
  pageTitleEn: z.string().max(160).default("Virtual Fitting Room"),
  pageSubtitleAr: z.string().max(500).default(""),
  pageSubtitleEn: z.string().max(500).default(""),
  measurementFields: z.array(measurementFieldSchema).max(20).default([]),
  garments: z.array(garmentSchema).max(100).default([]),
})

export function defaultMeasurementFields(): FittingRoomMeasurementField[] {
  return [
    { id: "height", labelAr: "الطول", labelEn: "Height", unit: "cm", type: "number", required: true, enabled: true, min: 120, max: 230 },
    { id: "weight", labelAr: "الوزن", labelEn: "Weight", unit: "kg", type: "number", required: true, enabled: true, min: 30, max: 250 },
    { id: "chest", labelAr: "محيط الصدر", labelEn: "Chest", unit: "cm", type: "number", required: false, enabled: true, min: 60, max: 180 },
    { id: "waist", labelAr: "محيط الخصر", labelEn: "Waist", unit: "cm", type: "number", required: false, enabled: true, min: 50, max: 180 },
    { id: "hips", labelAr: "محيط الورك", labelEn: "Hips", unit: "cm", type: "number", required: false, enabled: true, min: 60, max: 180 },
    { id: "shoulder", labelAr: "عرض الكتف", labelEn: "Shoulder width", unit: "cm", type: "number", required: false, enabled: true, min: 30, max: 70 },
    { id: "arm_length", labelAr: "طول الذراع", labelEn: "Arm length", unit: "cm", type: "number", required: false, enabled: true, min: 40, max: 90 },
    { id: "leg_length", labelAr: "طول الساق", labelEn: "Leg length", unit: "cm", type: "number", required: false, enabled: true, min: 60, max: 120 },
    { id: "shoe_size", labelAr: "مقاس الحذاء", labelEn: "Shoe size", unit: "", type: "text", required: false, enabled: true },
    {
      id: "notes",
      labelAr: "ملاحظات إضافية",
      labelEn: "Additional notes",
      unit: "",
      type: "text",
      placeholderAr: "مثال: أفضل قصة relaxed",
      placeholderEn: "e.g. prefer relaxed fit",
      required: false,
      enabled: true,
    },
  ]
}

export function defaultFittingRoomConfig(): FittingRoomConfig {
  return {
    enabled: true,
    allowPhotoUpload: true,
    allowMeasurements: true,
    useFashionAds: true,
    pageTitleAr: "غرفة القياس الافتراضية",
    pageTitleEn: "Virtual Fitting Room",
    pageSubtitleAr: "جرّب قطع الأزياء على جسمك قبل الشراء — ارفع صورتك أو أدخل قياساتك",
    pageSubtitleEn: "Try fashion before you buy — upload a photo or enter your body measurements",
    measurementFields: defaultMeasurementFields(),
    garments: [],
  }
}

export function parseFittingRoomConfig(raw: string | undefined): FittingRoomConfig {
  const defaults = defaultFittingRoomConfig()
  if (!raw) return defaults
  try {
    const parsed = fittingRoomConfigSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return defaults
    return {
      ...defaults,
      ...parsed.data,
      measurementFields:
        parsed.data.measurementFields.length > 0 ? parsed.data.measurementFields : defaults.measurementFields,
    }
  } catch {
    return defaults
  }
}

export function serializeFittingRoomConfig(config: FittingRoomConfig): string {
  return JSON.stringify(config)
}

export function newFittingRoomGarmentId(): string {
  return `fr_garment_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}
