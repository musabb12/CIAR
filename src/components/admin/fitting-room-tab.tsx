"use client"

import { useEffect, useState } from "react"
import {
  ExternalLink,
  GripVertical,
  Loader2,
  Plus,
  Ruler,
  Save,
  ScanLine,
  Shirt,
  Sparkles,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n-context"
import { toast } from "sonner"
import {
  defaultFittingRoomConfig,
  newFittingRoomGarmentId,
  type FittingRoomConfig,
  type FittingRoomGarmentItem,
  type FittingRoomMeasurementField,
} from "@/lib/fitting-room-config"

function LocalizedPair({
  label,
  valueAr,
  valueEn,
  onChangeAr,
  onChangeEn,
  multiline,
}: {
  label: string
  valueAr: string
  valueEn: string
  onChangeAr: (v: string) => void
  onChangeEn: (v: string) => void
  multiline?: boolean
}) {
  const Field = multiline ? Textarea : Input
  return (
    <div className="space-y-2 rounded-xl border border-border/40 bg-muted/10 p-4">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">العربية</Label>
          <Field value={valueAr} onChange={(e) => onChangeAr(e.target.value)} className={multiline ? "min-h-[72px]" : "h-10"} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">English</Label>
          <Field value={valueEn} onChange={(e) => onChangeEn(e.target.value)} dir="ltr" className={multiline ? "min-h-[72px]" : "h-10"} />
        </div>
      </div>
    </div>
  )
}

function commaList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

function joinList(values: string[]): string {
  return values.join(", ")
}

export function FittingRoomTab() {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const [config, setConfig] = useState<FittingRoomConfig>(defaultFittingRoomConfig())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/fitting-room", { cache: "no-store" })
        const data = await res.json()
        if (data.config) setConfig({ ...defaultFittingRoomConfig(), ...data.config })
      } catch {
        toast.error(t("admin.fitting_room_load_failed") || "تعذر تحميل إعدادات غرفة القياس")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [t])

  const patch = <K extends keyof FittingRoomConfig>(key: K, value: FittingRoomConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const updateField = (id: string, patchField: Partial<FittingRoomMeasurementField>) => {
    setConfig((prev) => ({
      ...prev,
      measurementFields: prev.measurementFields.map((f) => (f.id === id ? { ...f, ...patchField } : f)),
    }))
  }

  const updateGarment = (id: string, patchGarment: Partial<FittingRoomGarmentItem>) => {
    setConfig((prev) => ({
      ...prev,
      garments: prev.garments.map((g) => (g.id === id ? { ...g, ...patchGarment } : g)),
    }))
  }

  const addGarment = () => {
    const order = config.garments.length
    setConfig((prev) => ({
      ...prev,
      garments: [
        ...prev.garments,
        {
          id: newFittingRoomGarmentId(),
          titleAr: "قطعة جديدة",
          titleEn: "New garment",
          imageUrl: "",
          sizes: ["S", "M", "L", "XL"],
          colors: [],
          fabricTypes: [],
          enabled: true,
          order,
        },
      ],
    }))
  }

  const removeGarment = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      garments: prev.garments.filter((g) => g.id !== id).map((g, i) => ({ ...g, order: i })),
    }))
  }

  const moveGarment = (id: string, direction: -1 | 1) => {
    setConfig((prev) => {
      const list = [...prev.garments].sort((a, b) => a.order - b.order)
      const index = list.findIndex((g) => g.id === id)
      if (index < 0) return prev
      const target = index + direction
      if (target < 0 || target >= list.length) return prev
      const next = [...list]
      ;[next[index], next[target]] = [next[target], next[index]]
      return { ...prev, garments: next.map((g, i) => ({ ...g, order: i })) }
    })
  }

  const handleSave = async () => {
    if (!config.allowPhotoUpload && !config.allowMeasurements) {
      toast.error(isAr ? "فعّل رفع الصورة أو قياسات الجسم على الأقل" : "Enable photo upload or body measurements")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/fitting-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")
      setConfig({ ...defaultFittingRoomConfig(), ...data.config })
      toast.success(t("admin.fitting_room_saved") || "تم حفظ إعدادات غرفة القياس")
    } catch {
      toast.error(t("admin.fitting_room_save_failed") || "فشل حفظ الإعدادات")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const sortedGarments = [...config.garments].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[oklch(0.78_0.14_82)]" />
            <h2 className="text-2xl font-bold">{t("admin.fitting_room") || "غرفة القياس الافتراضية"}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.fitting_room_desc") ||
              "إدارة إعدادات غرفة القياس، حقول القياسات، وقطع الملابس المعروضة للزوار"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="rounded-xl gap-2" asChild>
            <a href="/#/fitting-room" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              {isAr ? "معاينة الصفحة" : "Preview page"}
            </a>
          </Button>
          <Button type="button" className="btn-gold rounded-xl gap-2" disabled={saving} onClick={() => void handleSave()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t("admin.save") || "حفظ"}
          </Button>
        </div>
      </div>

      <section className="rounded-2xl border border-border/50 bg-card/60 p-6 space-y-5">
        <h3 className="font-semibold">{isAr ? "الإعدادات العامة" : "General settings"}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl border border-border/40 p-4">
            <div>
              <p className="font-medium">{isAr ? "تفعيل غرفة القياس" : "Enable fitting room"}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "إظهار الصفحة والميزة للزوار" : "Show the page and feature to visitors"}</p>
            </div>
            <Switch checked={config.enabled} onCheckedChange={(v) => patch("enabled", v)} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/40 p-4">
            <div className="flex items-start gap-2">
              <ScanLine className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">{isAr ? "رفع الصورة" : "Photo upload"}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "السماح برفع صورة الجسم" : "Allow body photo upload"}</p>
              </div>
            </div>
            <Switch checked={config.allowPhotoUpload} onCheckedChange={(v) => patch("allowPhotoUpload", v)} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/40 p-4">
            <div className="flex items-start gap-2">
              <Ruler className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">{isAr ? "قياسات الجسم" : "Body measurements"}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "السماح بإدخال القياسات بدلاً من الصورة" : "Allow measurements instead of photo"}</p>
              </div>
            </div>
            <Switch checked={config.allowMeasurements} onCheckedChange={(v) => patch("allowMeasurements", v)} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/40 p-4">
            <div className="flex items-start gap-2">
              <Shirt className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">{isAr ? "إعلانات الأزياء" : "Fashion ads"}</p>
                <p className="text-xs text-muted-foreground">{isAr ? "دمج إعلانات الأزياء المنشورة تلقائياً" : "Auto-merge published fashion ads"}</p>
              </div>
            </div>
            <Switch checked={config.useFashionAds} onCheckedChange={(v) => patch("useFashionAds", v)} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/50 bg-card/60 p-6 space-y-4">
        <h3 className="font-semibold">{isAr ? "نصوص الصفحة" : "Page copy"}</h3>
        <LocalizedPair
          label={isAr ? "عنوان الصفحة" : "Page title"}
          valueAr={config.pageTitleAr}
          valueEn={config.pageTitleEn}
          onChangeAr={(v) => patch("pageTitleAr", v)}
          onChangeEn={(v) => patch("pageTitleEn", v)}
        />
        <LocalizedPair
          label={isAr ? "الوصف" : "Subtitle"}
          valueAr={config.pageSubtitleAr}
          valueEn={config.pageSubtitleEn}
          onChangeAr={(v) => patch("pageSubtitleAr", v)}
          onChangeEn={(v) => patch("pageSubtitleEn", v)}
          multiline
        />
      </section>

      <section className="rounded-2xl border border-border/50 bg-card/60 p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              {isAr ? "حقول القياسات" : "Measurement fields"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? "تحكم بالحقول التي يراها الزائر عند إدخال قياساته" : "Control fields shown when visitors enter measurements"}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {config.measurementFields.map((field) => (
            <div key={field.id} className="rounded-xl border border-border/40 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px]">{field.id}</Badge>
                  <span className="text-sm font-medium">{field.labelAr}</span>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={field.enabled} onCheckedChange={(v) => updateField(field.id, { enabled: v })} />
                    {isAr ? "مفعّل" : "Enabled"}
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={field.required} onCheckedChange={(v) => updateField(field.id, { required: v })} />
                    {isAr ? "مطلوب" : "Required"}
                  </label>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "التسمية (ع)" : "Label AR"}</Label>
                  <Input value={field.labelAr} onChange={(e) => updateField(field.id, { labelAr: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "التسمية (EN)" : "Label EN"}</Label>
                  <Input value={field.labelEn} onChange={(e) => updateField(field.id, { labelEn: e.target.value })} dir="ltr" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "الوحدة" : "Unit"}</Label>
                  <Input value={field.unit} onChange={(e) => updateField(field.id, { unit: e.target.value })} dir="ltr" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "النوع" : "Type"}</Label>
                  <Input value={field.type} disabled className="bg-muted/30" />
                </div>
              </div>
              {field.type === "select" && field.options?.length ? (
                <div className="rounded-lg border border-dashed border-border/50 bg-muted/10 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {isAr ? "خيارات القائمة" : "Select options"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {field.options.map((opt) => (
                      <Badge key={opt.value} variant="secondary" className="rounded-full">
                        {opt.labelAr} / {opt.labelEn}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/50 bg-card/60 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Shirt className="h-4 w-4" />
              {isAr ? "قطع الملابس" : "Garments"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? "قطع مخصصة تظهر في غرفة القياس — بالإضافة إلى إعلانات الأزياء إن فُعّلت" : "Custom garments shown in the fitting room — plus fashion ads if enabled"}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" className="rounded-xl gap-2" onClick={addGarment}>
            <Plus className="h-4 w-4" />
            {isAr ? "إضافة قطعة" : "Add garment"}
          </Button>
        </div>

        {sortedGarments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-xl">
            {isAr ? "لا توجد قطع مخصصة — يمكن الاعتماد على إعلانات الأزياء" : "No custom garments — fashion ads can be used instead"}
          </p>
        ) : (
          <div className="space-y-4">
            {sortedGarments.map((garment, index) => (
              <div key={garment.id} className="rounded-xl border border-border/40 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button type="button" className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={index === 0} onClick={() => moveGarment(garment.id, -1)}>
                        <GripVertical className="h-4 w-4" />
                      </button>
                    </div>
                    {garment.imageUrl ? (
                      <img src={garment.imageUrl} alt="" className="h-14 w-14 rounded-lg object-cover border" />
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center">
                        <Shirt className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{garment.titleAr}</p>
                      <p className="text-xs text-muted-foreground">{garment.titleEn}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs">
                      <Switch checked={garment.enabled} onCheckedChange={(v) => updateGarment(garment.id, { enabled: v })} />
                      {isAr ? "مفعّل" : "Enabled"}
                    </label>
                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeGarment(garment.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">{isAr ? "الاسم (ع)" : "Title AR"}</Label>
                    <Input value={garment.titleAr} onChange={(e) => updateGarment(garment.id, { titleAr: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{isAr ? "الاسم (EN)" : "Title EN"}</Label>
                    <Input value={garment.titleEn} onChange={(e) => updateGarment(garment.id, { titleEn: e.target.value })} dir="ltr" />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">{isAr ? "رابط الصورة" : "Image URL"}</Label>
                    <Input value={garment.imageUrl} onChange={(e) => updateGarment(garment.id, { imageUrl: e.target.value })} dir="ltr" placeholder="https://..." />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{isAr ? "المقاسات (مفصولة بفاصلة)" : "Sizes (comma-separated)"}</Label>
                    <Input
                      value={joinList(garment.sizes)}
                      onChange={(e) => updateGarment(garment.id, { sizes: commaList(e.target.value) })}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{isAr ? "الألوان" : "Colors"}</Label>
                    <Input
                      value={joinList(garment.colors)}
                      onChange={(e) => updateGarment(garment.id, { colors: commaList(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{isAr ? "العلامة" : "Brand"}</Label>
                    <Input value={garment.brand || ""} onChange={(e) => updateGarment(garment.id, { brand: e.target.value || undefined })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{isAr ? "السعر" : "Price"}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={garment.price ?? ""}
                      onChange={(e) => updateGarment(garment.id, { price: e.target.value ? Number(e.target.value) : undefined })}
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
