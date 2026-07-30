import type { BodyMeasurements } from "@/lib/virtual-fitting/types"
import { defaultGenderOptions } from "@/lib/fitting-room-config"

const LETTER_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"]

const GENDER_LABELS: Record<string, { ar: string; en: string }> = Object.fromEntries(
  defaultGenderOptions().map((opt) => [opt.value, { ar: opt.labelAr, en: opt.labelEn }])
)

function isChildProfile(measurements: BodyMeasurements): boolean {
  const gender = String(measurements.gender || "")
  const age = Number(measurements.age) || 0
  return gender === "boy" || gender === "girl" || (age > 0 && age < 14)
}

function sizeIndexOffset(measurements: BodyMeasurements): number {
  const gender = String(measurements.gender || "")
  if (gender === "boy" || gender === "girl") return -2
  if (gender === "young_female") return -1
  if (isChildProfile(measurements)) return -2
  return 0
}

export function recommendGarmentSize(
  measurements: BodyMeasurements,
  availableSizes: string[] = []
): { size: string; notes: string } {
  const height = Number(measurements.height) || 170
  const weight = Number(measurements.weight) || 70
  const chest = Number(measurements.chest) || 0
  const waist = Number(measurements.waist) || 0
  const offset = sizeIndexOffset(measurements)
  const child = isChildProfile(measurements)

  const sizes = availableSizes.filter(Boolean)
  if (sizes.length === 0) {
    const bmi = weight / Math.pow(height / 100, 2)
    let index = 2
    if (bmi < 20) index = 0
    else if (bmi < 26) index = 1
    else if (bmi < 30) index = 2
    else index = 3
    index = Math.max(0, Math.min(3, index + offset))
    const fallback = ["S", "M", "L", "XL"][index] || "M"
    return {
      size: fallback,
      notes: child ? "Based on age, gender, and body estimate" : "Based on height/weight estimate",
    }
  }

  const numericSizes = sizes
    .map((s) => ({ raw: s, value: Number(s) }))
    .filter((s) => !Number.isNaN(s.value))
  if (numericSizes.length > 0) {
    let target = Math.round(height / 3 + (weight - 70) * 0.15)
    if (child) target = Math.round(target * 0.82)
    const best = numericSizes.reduce((prev, curr) =>
      Math.abs(curr.value - target) < Math.abs(prev.value - target) ? curr : prev
    )
    return {
      size: best.raw,
      notes: child ? "Based on age, gender, and numeric sizing" : "Based on height, weight, and numeric sizing",
    }
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

  index = Math.max(0, Math.min(pool.length - 1, index + offset))
  return {
    size: pool[index],
    notes: child ? "Based on age, gender, and body measurements" : "Based on body measurements",
  }
}

export function formatMeasurementsSummary(
  measurements: BodyMeasurements,
  isAr: boolean
): string {
  const labels: Record<string, { ar: string; en: string }> = {
    age: { ar: "العمر", en: "Age" },
    gender: { ar: "الجنس", en: "Gender" },
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
      if (key === "gender") {
        const genderLabel = GENDER_LABELS[String(value)]?.[isAr ? "ar" : "en"] || String(value)
        return `${label}: ${genderLabel}`
      }
      if (key === "age") {
        return `${label}: ${value}${isAr ? " سنة" : " yrs"}`
      }
      return `${label}: ${value}`
    })
    .join(" · ")
}
