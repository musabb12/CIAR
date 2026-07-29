"use client"

import { useEffect, useRef, useState } from "react"
import { Film, Link2, Loader2, Upload, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AD_DURATION_OPTIONS,
  AD_PLACEMENTS,
  AD_POSITIONS,
  AD_PLACEMENT_META,
  getPlacementLabel,
  getPositionLabel,
} from "@/lib/site-ads"
import {
  AD_PAYMENT_METHODS,
  AD_PAYMENT_STATUSES,
  collectVideoUrls,
  emptyAdProductDetails,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  joinList,
  normalizeVideoUrl,
  readDetailFieldValue,
  writeDetailFieldValue,
  type AdProductDetails,
} from "@/lib/ad-product-details"
import {
  defaultAdListingTypesStore,
  getEnabledListingTypes,
  getListingTypeLabelFromStore,
  type AdListingFieldConfig,
  type AdListingTypesStore,
} from "@/lib/ad-listing-types-config"
import { getListingTypeConfig } from "@/lib/ad-listing-fields"
import { toast } from "sonner"
import { AdPricingQuoteBox } from "@/components/ads/ad-pricing-quote-box"
import { CurrencySelect } from "@/components/ads/currency-select"
import type { AdQuote } from "@/lib/ad-pricing"

type AdProductDetailsFormProps = {
  value: AdProductDetails
  onChange: (value: AdProductDetails) => void
  isAr: boolean
  showPlacement?: boolean
  showPayment?: boolean
  showAdminPaymentStatus?: boolean
  pricingMode?: "admin" | "advertiser"
  listingTypesStore?: AdListingTypesStore
  allListingTypes?: boolean
}

export function AdProductDetailsForm({
  value,
  onChange,
  isAr,
  showPlacement = true,
  showPayment = true,
  showAdminPaymentStatus = false,
  pricingMode = "advertiser",
  listingTypesStore,
  allListingTypes = false,
}: AdProductDetailsFormProps) {
  const [typesStore, setTypesStore] = useState<AdListingTypesStore>(
    listingTypesStore || defaultAdListingTypesStore()
  )
  const details = { ...emptyAdProductDetails(), ...value }
  const listingType = details.listingType || typesStore.defaultTypeId || "general"
  const typeConfig = getListingTypeConfig(listingType, typesStore)
  const typeOptions = allListingTypes ? typesStore.types : getEnabledListingTypes(typesStore)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [videoLinkDraft, setVideoLinkDraft] = useState("")

  const patch = (partial: Partial<AdProductDetails>) => onChange({ ...details, ...partial })

  useEffect(() => {
    if (listingTypesStore) setTypesStore(listingTypesStore)
  }, [listingTypesStore])

  useEffect(() => {
    if (listingTypesStore) return
    const load = async () => {
      try {
        const res = await fetch("/api/ads/listing-types")
        const data = await res.json()
        if (res.ok && data.types) {
          setTypesStore({
            defaultTypeId: data.defaultTypeId || "general",
            types: data.types,
          })
        }
      } catch {
        // keep defaults
      }
    }
    void load()
  }, [listingTypesStore])

  const handleListingTypeChange = (nextType: string) => {
    onChange({
      ...emptyAdProductDetails(),
      listingType: nextType,
      currency: details.currency,
      contactPhone: details.contactPhone,
      whatsappLink: details.whatsappLink,
      paymentMethod: details.paymentMethod,
      paymentStatus: details.paymentStatus,
      paymentAmount: details.paymentAmount,
      requestedPlacement: details.requestedPlacement,
      requestedPosition: details.requestedPosition,
      requestedDurationDays: details.requestedDurationDays,
      videoUrl: details.videoUrl,
      videoUrls: details.videoUrls,
    })
  }

  const uploadVideoFile = async (file: File) => {
    setUploadingVideo(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("category", "general")
      const res = await fetch("/api/media", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "upload failed")
      const nextUrls = [...collectVideoUrls(details), data.url].slice(0, 5)
      patch({ videoUrls: nextUrls, videoUrl: nextUrls[0] })
      toast.success(isAr ? "تم رفع الفيديو" : "Video uploaded")
    } catch {
      toast.error(isAr ? "فشل رفع الفيديو" : "Video upload failed")
    } finally {
      setUploadingVideo(false)
    }
  }

  const addVideoLink = () => {
    const normalized = normalizeVideoUrl(videoLinkDraft)
    if (!normalized) {
      toast.error(isAr ? "أدخل رابط فيديو صالحاً" : "Enter a valid video link")
      return
    }
    const nextUrls = [...collectVideoUrls(details), normalized].slice(0, 5)
    patch({ videoUrls: nextUrls, videoUrl: nextUrls[0] })
    setVideoLinkDraft("")
    toast.success(isAr ? "تمت إضافة رابط الفيديو" : "Video link added")
  }

  const removeVideo = (url: string) => {
    const nextUrls = collectVideoUrls(details).filter((item) => item !== url)
    patch({ videoUrls: nextUrls, videoUrl: nextUrls[0] || "" })
  }

  const renderField = (field: AdListingFieldConfig) => {
    const label = isAr ? field.labelAr : field.labelEn
    const placeholder = isAr ? field.placeholderAr : field.placeholderEn
    const fieldValue = readDetailFieldValue(details, field.id)

    if (field.type === "textarea") {
      return (
        <div key={field.id} className="space-y-2 sm:col-span-2">
          <Label>{label}</Label>
          <Textarea
            rows={2}
            value={fieldValue}
            onChange={(e) => onChange(writeDetailFieldValue(details, field.id, field.type, e.target.value))}
            placeholder={placeholder}
          />
        </div>
      )
    }

    return (
      <div key={field.id} className="space-y-2">
        <Label>{label}</Label>
        <Input
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
          value={fieldValue}
          onChange={(e) => onChange(writeDetailFieldValue(details, field.id, field.type, e.target.value))}
          placeholder={placeholder}
        />
      </div>
    )
  }

  const handleQuote = (quote: AdQuote) => {
    if (pricingMode !== "advertiser") return
    if (details.paymentAmount === quote.amount && details.currency === quote.currency) return
    patch({ paymentAmount: quote.amount, currency: quote.currency })
  }

  const videoUrls = collectVideoUrls(details)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{isAr ? "نوع الإعلان" : "Listing type"}</Label>
        <Select value={listingType} onValueChange={handleListingTypeChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {typeOptions.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {isAr ? type.labelAr : type.labelEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {isAr ? typeConfig.descriptionAr : typeConfig.descriptionEn}
        </p>
      </div>

      {typeConfig.fields.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {typeConfig.fields.map(renderField)}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {typeConfig.showStock !== false ? (
          <div className="space-y-2">
            <Label>{isAr ? "العدد المتبقي" : "Stock remaining"}</Label>
            <Input
              type="number"
              min={0}
              value={details.stockRemaining ?? ""}
              onChange={(e) => patch({ stockRemaining: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label>{isAr ? "السعر" : "Price"}</Label>
          <Input
            type="number"
            min={0}
            value={details.price ?? ""}
            onChange={(e) => patch({ price: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
        <div className="space-y-2">
          <Label>{isAr ? "العملة" : "Currency"}</Label>
          <CurrencySelect
            value={details.currency || "SAR"}
            onChange={(code) => patch({ currency: code })}
            isAr={isAr}
          />
        </div>
        {typeConfig.showDiscount !== false ? (
          <div className="space-y-2">
            <Label>{isAr ? "نسبة الحسم %" : "Discount %"}</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={details.discountPercent ?? ""}
              onChange={(e) => patch({ discountPercent: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label>{isAr ? "رقم الهاتف / واتساب" : "Phone / WhatsApp"}</Label>
          <Input
            dir="ltr"
            value={details.contactPhone || ""}
            onChange={(e) => patch({ contactPhone: e.target.value })}
            placeholder="+9665..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{isAr ? "رابط واتساب" : "WhatsApp link"}</Label>
        <Input
          dir="ltr"
          value={details.whatsappLink || ""}
          onChange={(e) => patch({ whatsappLink: e.target.value })}
          placeholder="https://wa.me/9665..."
        />
      </div>

      {typeConfig.showShipping !== false ? (
        <div className="space-y-2">
          <Label>{isAr ? "الشحن" : "Shipping"}</Label>
          <Textarea
            rows={2}
            value={details.shippingInfo || ""}
            onChange={(e) => patch({ shippingInfo: e.target.value })}
            placeholder={isAr ? "مجاني داخل المدينة — 3 أيام توصيل" : "Free in-city — 3-day delivery"}
          />
        </div>
      ) : null}

      <div className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Film className="h-4 w-4 text-primary" />
          {isAr ? "فيديو الإعلان" : "Ad video"}
        </div>
        <p className="text-xs text-muted-foreground">
          {isAr
            ? "ارفع فيديو من جهازك أو الصق رابطاً من يوتيوب، تيك توك، إنستغرام، فيسبوك، أو أي موقع."
            : "Upload from your device or paste a link from YouTube, TikTok, Instagram, Facebook, or any site."}
        </p>

        <div className="flex flex-wrap gap-2">
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void uploadVideoFile(file)
              e.target.value = ""
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-full"
            disabled={uploadingVideo || videoUrls.length >= 5}
            onClick={() => videoInputRef.current?.click()}
          >
            {uploadingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isAr ? "رفع من الجهاز" : "Upload from device"}
          </Button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Link2 className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              dir="ltr"
              value={videoLinkDraft}
              onChange={(e) => setVideoLinkDraft(e.target.value)}
              placeholder={isAr ? "https://youtube.com/... أو tiktok.com/..." : "https://youtube.com/... or tiktok.com/..."}
              className="ps-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addVideoLink()
                }
              }}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="rounded-full"
            disabled={videoUrls.length >= 5}
            onClick={addVideoLink}
          >
            {isAr ? "إضافة الرابط" : "Add link"}
          </Button>
        </div>

        {videoUrls.length > 0 ? (
          <ul className="space-y-2">
            {videoUrls.map((url) => (
              <li
                key={url}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/70 px-3 py-2 text-xs"
              >
                <span dir="ltr" className="truncate text-muted-foreground">{url}</span>
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => removeVideo(url)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {showPayment ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{isAr ? "طريقة الدفع" : "Payment method"}</Label>
              <Select value={details.paymentMethod || "whatsapp"} onValueChange={(v) => patch({ paymentMethod: v as AdProductDetails["paymentMethod"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AD_PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>{getPaymentMethodLabel(method, isAr)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {pricingMode === "admin" ? (
              <div className="space-y-2">
                <Label>{isAr ? "مبلغ الإعلان (تعديل يدوي)" : "Ad fee (manual override)"}</Label>
                <Input
                  type="number"
                  min={0}
                  value={details.paymentAmount ?? ""}
                  onChange={(e) => patch({ paymentAmount: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            ) : null}
          </div>
          {pricingMode === "advertiser" ? (
            <AdPricingQuoteBox details={details} isAr={isAr} onQuote={handleQuote} />
          ) : null}
        </div>
      ) : null}

      {showAdminPaymentStatus ? (
        <div className="space-y-2">
          <Label>{isAr ? "حالة الدفع" : "Payment status"}</Label>
          <Select value={details.paymentStatus || "pending"} onValueChange={(v) => patch({ paymentStatus: v as AdProductDetails["paymentStatus"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {AD_PAYMENT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>{getPaymentStatusLabel(status, isAr)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {showPlacement ? (
        <div className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-4">
          <p className="text-sm font-semibold">{isAr ? "أين يظهر الإعلان؟" : "Where should the ad appear?"}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>{isAr ? "مكان الظهور" : "Placement"}</Label>
              <Select value={details.requestedPlacement || "home_after_platforms"} onValueChange={(v) => patch({ requestedPlacement: v as AdProductDetails["requestedPlacement"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AD_PLACEMENTS.map((placement) => (
                    <SelectItem key={placement} value={placement}>{getPlacementLabel(placement, isAr ? "ar" : "en")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "الموضع" : "Slot"}</Label>
              <Select value={details.requestedPosition || "slot_1"} onValueChange={(v) => patch({ requestedPosition: v as AdProductDetails["requestedPosition"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AD_POSITIONS.map((position) => (
                    <SelectItem key={position} value={position}>{getPositionLabel(position, isAr ? "ar" : "en")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? "مدة الإعلان" : "Duration"}</Label>
              <Select value={String(details.requestedDurationDays || 30)} onValueChange={(v) => patch({ requestedDurationDays: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AD_DURATION_OPTIONS.map((days) => (
                    <SelectItem key={days} value={String(days)}>{days} {isAr ? "يوم" : "days"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {AD_PLACEMENT_META[details.requestedPlacement || "home_after_platforms"][isAr ? "previewHintAr" : "labelEn"]}
          </p>
        </div>
      ) : null}
    </div>
  )
}
