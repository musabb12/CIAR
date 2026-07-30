"use client"

import { useCallback, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ImagePlus, Loader2, ScanLine, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  imageValidationMessage,
  validateUserBodyImage,
  USER_IMAGE_CONSTRAINTS,
} from "@/lib/virtual-fitting/validate-user-image"
import type { UserImageState } from "@/lib/virtual-fitting/types"

type ImageUploaderProps = {
  value: UserImageState | null
  onChange: (image: UserImageState | null) => void
  isAr: boolean
  disabled?: boolean
}

export function ImageUploader({ value, onChange, isAr, disabled }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processFile = useCallback(
    async (file: File) => {
      setValidating(true)
      setError(null)
      try {
        const result = await validateUserBodyImage(file)
        if (!result.ok) {
          setError(imageValidationMessage(result.code, isAr))
          return
        }
        const previewUrl = URL.createObjectURL(file)
        onChange({ file, previewUrl, width: result.width, height: result.height })
      } finally {
        setValidating(false)
      }
    },
    [isAr, onChange]
  )

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setDragOver(false)
      if (disabled || validating) return
      const file = event.dataTransfer.files?.[0]
      if (file) void processFile(file)
    },
    [disabled, processFile, validating]
  )

  const onFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void processFile(file)
    event.target.value = ""
  }

  const clear = () => {
    onChange(null)
    setError(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold flex items-center gap-2">
          <ScanLine className="h-4 w-4 text-[oklch(0.78_0.14_82)]" />
          {isAr ? "صورتك (جسم كامل)" : "Your photo (full body)"}
        </p>
        {value ? (
          <button
            type="button"
            onClick={clear}
            disabled={disabled}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" />
            {isAr ? "إزالة" : "Remove"}
          </button>
        ) : null}
      </div>

      {value ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-inner"
        >
          <div className="aspect-[3/4] max-h-[420px] w-full">
            <img src={value.previewUrl} alt="" className="h-full w-full object-cover object-top" />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs text-white/90">
            {value.width}×{value.height}px
          </div>
        </motion.div>
      ) : (
        <motion.div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
          }}
          onDragOver={(e) => {
            e.preventDefault()
            if (!disabled) setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={cn(
            "group relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300",
            "border-[oklch(0.78_0.14_82/25%)] bg-muted/30",
            "hover:border-[oklch(0.78_0.14_82/45%)] hover:bg-muted/40",
            dragOver && "border-[oklch(0.78_0.14_82/60%)] scale-[1.01] shadow-[0_0_48px_oklch(0.78_0.14_82/18%)]",
            disabled && "pointer-events-none opacity-60"
          )}
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[oklch(0.78_0.14_82/15%)] ring-1 ring-[oklch(0.78_0.14_82/30%)]">
            {validating ? (
              <Loader2 className="h-6 w-6 animate-spin text-[oklch(0.78_0.14_82)]" />
            ) : (
              <Upload className="h-6 w-6 text-[oklch(0.78_0.14_82)] transition group-hover:scale-110" />
            )}
          </div>
          <p className="text-sm font-semibold">
            {isAr ? "اسحب صورتك أو انقر للرفع" : "Drag your photo or click to upload"}
          </p>
          <p className="mt-2 max-w-xs text-xs text-muted-foreground">
            {isAr
              ? "صورة عمودية للجسم كاملاً — JPG/PNG/WebP حتى 10MB"
              : "Vertical full-body photo — JPG/PNG/WebP up to 10MB"}
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-[11px] text-muted-foreground">
            <ImagePlus className="h-3.5 w-3.5" />
            {isAr ? "نسبة م ideal ~3:4" : "Ideal ratio ~3:4"}
          </div>
        </motion.div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={USER_IMAGE_CONSTRAINTS.allowedTypes.join(",")}
        className="hidden"
        onChange={onFileInput}
        disabled={disabled || validating}
      />

      {error ? (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-destructive"
        >
          {error}
        </motion.p>
      ) : null}
    </div>
  )
}
