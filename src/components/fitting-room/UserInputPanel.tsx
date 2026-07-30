"use client"

import { Ruler, ScanLine } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FittingRoomMeasurementField } from "@/lib/fitting-room-config"
import type { BodyMeasurements, UserImageState, UserInputMode } from "@/lib/virtual-fitting/types"
import { ImageUploader } from "@/components/fitting-room/ImageUploader"
import { BodyMeasurementsForm } from "@/components/fitting-room/BodyMeasurementsForm"

type UserInputPanelProps = {
  mode: UserInputMode
  onModeChange: (mode: UserInputMode) => void
  allowPhotoUpload: boolean
  allowMeasurements: boolean
  measurementFields: FittingRoomMeasurementField[]
  userImage: UserImageState | null
  onUserImageChange: (image: UserImageState | null) => void
  measurements: BodyMeasurements
  onMeasurementsChange: (values: BodyMeasurements) => void
  measurementErrors: Record<string, string>
  isAr: boolean
  disabled?: boolean
}

export function UserInputPanel({
  mode,
  onModeChange,
  allowPhotoUpload,
  allowMeasurements,
  measurementFields,
  userImage,
  onUserImageChange,
  measurements,
  onMeasurementsChange,
  measurementErrors,
  isAr,
  disabled,
}: UserInputPanelProps) {
  const showTabs = allowPhotoUpload && allowMeasurements

  return (
    <div className="space-y-4">
      {showTabs ? (
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/40 bg-muted/20 p-1">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onModeChange("photo")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
              mode === "photo"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ScanLine className="h-4 w-4" />
            {isAr ? "رفع صورة" : "Upload photo"}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onModeChange("measurements")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
              mode === "measurements"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Ruler className="h-4 w-4" />
            {isAr ? "قياسات الجسم" : "Body measurements"}
          </button>
        </div>
      ) : null}

      {mode === "photo" && allowPhotoUpload ? (
        <ImageUploader value={userImage} onChange={onUserImageChange} isAr={isAr} disabled={disabled} />
      ) : null}

      {mode === "measurements" && allowMeasurements ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Ruler className="h-4 w-4 text-[oklch(0.78_0.14_82)]" />
            {isAr ? "قياسات جسمك" : "Your body measurements"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? "أدخل قياساتك بدلاً من رفع صورة — سنقترح المقاس المناسب للقطعة المختارة"
              : "Enter your measurements instead of uploading a photo — we will suggest the best size"}
          </p>
          <BodyMeasurementsForm
            fields={measurementFields}
            values={measurements}
            onChange={onMeasurementsChange}
            errors={measurementErrors}
            isAr={isAr}
            disabled={disabled}
          />
          {measurementErrors._form ? (
            <p className="text-xs text-destructive">{measurementErrors._form}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
