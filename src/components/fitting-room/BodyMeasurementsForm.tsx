"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { FittingRoomMeasurementField } from "@/lib/fitting-room-config"
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
                <span className="ms-1 text-xs font-normal text-muted-foreground">({field.unit})</span>
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

  const hasAny = Object.values(values).some((v) => String(v).trim() !== "")
  if (!hasAny) {
    errors._form = isAr ? "أدخل قياساً واحداً على الأقل" : "Enter at least one measurement"
  }

  return { ok: Object.keys(errors).length === 0, errors }
}
