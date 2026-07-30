"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { defaultGenderOptions, type FittingRoomMeasurementField } from "@/lib/fitting-room-config"
import type { BodyMeasurements } from "@/lib/virtual-fitting/types"
import { cn } from "@/lib/utils"

type BodyMeasurementsFormProps = {
  fields: FittingRoomMeasurementField[]
  values: BodyMeasurements
  onChange: (values: BodyMeasurements) => void
  errors: Record<string, string>
  isAr: boolean
  disabled?: boolean
}

export function BodyMeasurementsForm({
  fields,
  values,
  onChange,
  errors,
  isAr,
  disabled,
}: BodyMeasurementsFormProps) {
  const enabledFields = fields.filter((f) => f.enabled)

  const patch = (id: string, value: string) => {
    onChange({ ...values, [id]: value })
  }

  if (enabledFields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {isAr ? "لا توجد حقول قياس متاحة" : "No measurement fields available"}
      </p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {enabledFields.map((field) => {
        const label = isAr ? field.labelAr : field.labelEn
        const placeholder = isAr ? field.placeholderAr : field.placeholderEn
        const value = values[field.id] ?? ""
        const error = errors[field.id]

        if (field.type === "select") {
          const options =
            field.options && field.options.length > 0 ? field.options : defaultGenderOptions()

          return (
            <div key={field.id} className="space-y-2">
              <Label>
                {label}
                {field.required ? <span className="text-destructive ms-1">*</span> : null}
              </Label>
              <select
                value={String(value)}
                disabled={disabled}
                onChange={(e) => patch(field.id, e.target.value)}
                className={cn(
                  "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow]",
                  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  error && "border-destructive"
                )}
              >
                <option value="" disabled>
                  {isAr ? "اختر..." : "Select..."}
                </option>
                {options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {isAr ? opt.labelAr : opt.labelEn}
                  </option>
                ))}
              </select>
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
            </div>
          )
        }

        if (field.type === "text" && field.id === "notes") {
          return (
            <div key={field.id} className="space-y-2 sm:col-span-2">
              <Label>{label}</Label>
              <Textarea
                rows={3}
                value={String(value)}
                disabled={disabled}
                placeholder={placeholder}
                onChange={(e) => patch(field.id, e.target.value)}
                className={cn(error && "border-destructive")}
              />
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
            </div>
          )
        }

        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {label}
              {field.required ? <span className="text-destructive ms-1">*</span> : null}
              {field.unit ? (
                <span className="ms-1 text-xs font-normal text-muted-foreground">
                  ({field.id === "age" ? (isAr ? "سنة" : "years") : field.unit})
                </span>
              ) : null}
            </Label>
            <Input
              type={field.type === "number" ? "number" : "text"}
              inputMode={field.type === "number" ? "decimal" : "text"}
              min={field.min}
              max={field.max}
              value={String(value)}
              disabled={disabled}
              placeholder={placeholder}
              onChange={(e) => patch(field.id, e.target.value)}
              className={cn("rounded-xl", error && "border-destructive")}
            />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
        )
      })}
    </div>
  )
}

export function validateBodyMeasurements(
  fields: FittingRoomMeasurementField[],
  values: BodyMeasurements,
  isAr: boolean
): { ok: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  const msg = isAr ? "هذا الحقل مطلوب" : "This field is required"

  for (const field of fields.filter((f) => f.enabled)) {
    const raw = values[field.id]
    const text = String(raw ?? "").trim()
    if (field.required && !text) {
      errors[field.id] = msg
      continue
    }
    if (field.type === "number" && text) {
      const num = Number(text)
      if (Number.isNaN(num)) {
        errors[field.id] = isAr ? "أدخل رقماً صحيحاً" : "Enter a valid number"
      } else if (field.min != null && num < field.min) {
        errors[field.id] = isAr ? `الحد الأدنى ${field.min}` : `Minimum ${field.min}`
      } else if (field.max != null && num > field.max) {
        errors[field.id] = isAr ? `الحد الأقصى ${field.max}` : `Maximum ${field.max}`
      }
    }
  }

  const hasAny = fields.some((f) => f.enabled && String(values[f.id] ?? "").trim() !== "")
  if (!hasAny) {
    errors._form = isAr ? "أدخل قياساً واحداً على الأقل" : "Enter at least one measurement"
  }

  return { ok: Object.keys(errors).length === 0, errors }
}

export function pickBodyMeasurementValues(
  fields: FittingRoomMeasurementField[],
  values: BodyMeasurements
): BodyMeasurements {
  const picked: BodyMeasurements = {}
  for (const field of fields) {
    if (!field.enabled) continue
    const raw = values[field.id]
    if (String(raw ?? "").trim() !== "") picked[field.id] = raw
  }
  return picked
}
