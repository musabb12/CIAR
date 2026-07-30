import type { BodyMeasurements } from "@/lib/virtual-fitting/types"

const LETTER_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"]

export function recommendGarmentSize(
  measurements: BodyMeasurements,
  availableSizes: string[] = []
): { size: string; notes: string } {
  const height = Number(measurements.height) || 170
  const weight = Number(measurements.weight) || 70
  const chest = Number(measurements.chest) || 0
  const waist = Number(measurements.waist) || 0

  const sizes = availableSizes.filter(Boolean)
  if (sizes.length === 0) {
    const bmi = weight / Math.pow(height / 100, 2)
    if (bmi < 20) return { size: "S", notes: "Based on height/weight estimate" }
    if (bmi < 26) return { size: "M", notes: "Based on height/weight estimate" }
    if (bmi < 30) return { size: "L", notes: "Based on height/weight estimate" }
    return { size: "XL", notes: "Based on height/weight estimate" }
  }

  const numericSizes = sizes
    .map((s) => ({ raw: s, value: Number(s) }))
    .filter((s) => !Number.isNaN(s.value))
  if (numericSizes.length > 0) {
    const target = Math.round(height / 3 + (weight - 70) * 0.15)
    const best = numericSizes.reduce((prev, curr) =>
      Math.abs(curr.value - target) < Math.abs(prev.value - target) ? curr : prev
    )
    return { size: best.raw, notes: "Based on height, weight, and numeric sizing" }
  }

  const letterAvailable = sizes.filter((s) => LETTER_SIZES.includes(s.toUpperCase()))
  const pool = letterAvailable.length > 0 ? letterAvailable : sizes
  let index = 2
  if (chest > 0) {
    if (chest < 88) index = 0
    else if (chest < 96) index = 1
    else if (chest < 104) index = 2
    else if (chest < 112) index = 3
    else if (chest < 120) index = 4
    else index = 5
  } else if (waist > 0) {
    if (waist < 72) index = 0
    else if (waist < 80) index = 1
    else if (waist < 88) index = 2
    else if (waist < 96) index = 3
    else if (waist < 104) index = 4
    else index = 5
  } else {
    const bmi = weight / Math.pow(height / 100, 2)
    if (bmi < 20) index = 0
    else if (bmi < 24) index = 1
    else if (bmi < 28) index = 2
    else if (bmi < 32) index = 3
    else index = 4
  }

  index = Math.max(0, Math.min(pool.length - 1, index))
  return { size: pool[index], notes: "Based on body measurements" }
}

export function formatMeasurementsSummary(
  measurements: BodyMeasurements,
  isAr: boolean
): string {
  const labels: Record<string, { ar: string; en: string }> = {
    height: { ar: "الطول", en: "Height" },
    weight: { ar: "الوزن", en: "Weight" },
    chest: { ar: "الصدر", en: "Chest" },
    waist: { ar: "الخصر", en: "Waist" },
    hips: { ar: "الورك", en: "Hips" },
    shoulder: { ar: "الكتف", en: "Shoulder" },
    arm_length: { ar: "الذراع", en: "Arm" },
    leg_length: { ar: "الساق", en: "Leg" },
    shoe_size: { ar: "الحذاء", en: "Shoe" },
    notes: { ar: "ملاحظات", en: "Notes" },
  }

  return Object.entries(measurements)
    .filter(([, value]) => String(value).trim() !== "")
    .map(([key, value]) => {
      const label = labels[key]?.[isAr ? "ar" : "en"] || key
      return `${label}: ${value}`
    })
    .join(" · ")
}
