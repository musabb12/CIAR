"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { ExternalLink, Filter, Loader2, Megaphone, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/lib/i18n-context"
import { useRouter } from "@/lib/router-context"
import { isDefaultSiteAd, mergePublicAdsWithFashionDemos } from "@/lib/default-site-ads"
import {
  AD_PLACEMENTS,
  getPlacementLabel,
  getPositionLabel,
  type AdPlacement,
  type SiteAdRecord,
} from "@/lib/site-ads"
import { AdProductDetailsCard } from "@/components/ads/ad-product-details-card"

function AdListingCard({
  ad,
  isAr,
}: {
  ad: SiteAdRecord
  isAr: boolean
}) {
  const isDefault = isDefaultSiteAd(ad)
  const isExternal = Boolean(ad.link && /^https?:\/\//i.test(ad.link))

  const card = (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[oklch(0.76_0.19_48/15%)] bg-gradient-to-b from-[oklch(0.76_0.19_48/6%)] to-transparent shadow-sm transition hover:border-[oklch(0.76_0.19_48/30%)] hover:shadow-md">
      {ad.imageUrl ? (
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute start-3 top-3 flex flex-wrap gap-1.5">
            <Badge className="bg-[oklch(0.76_0.19_48)] text-white">
              <Megaphone className="me-1 h-3 w-3" />
              {isAr ? "إعلان" : "Ad"}
            </Badge>
            {isDefault ? (
              <Badge variant="secondary">{isAr ? "افتراضي" : "Default"}</Badge>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium text-muted-foreground">{ad.companyName}</p>
        <h3 className="mt-1 text-lg font-bold text-foreground">{ad.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
          {ad.description}
        </p>

        <div className="mt-3">
          <AdProductDetailsCard details={ad.productDetails} isAr={isAr} compact />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          <Badge variant="outline">{getPlacementLabel(ad.placement, isAr ? "ar" : "en")}</Badge>
          <Badge variant="outline">{getPositionLabel(ad.position, isAr ? "ar" : "en")}</Badge>
        </div>

        {ad.link ? (
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[oklch(0.76_0.19_48)]">
            {isAr ? "اعرف المزيد" : "Learn more"}
            <ExternalLink className="h-4 w-4" />
          </span>
        ) : null}
      </div>
    </article>
  )

  if (!ad.link) return card

  return (
    <a
      href={ad.link}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="block h-full transition hover:opacity-95"
    >
      {card}
    </a>
  )
}

export function AdsPage() {
  const { t, locale } = useI18n()
  const { navigate } = useRouter()
  const isAr = locale === "ar"
  const [ads, setAds] = useState<SiteAdRecord[]>(() => mergePublicAdsWithFashionDemos([], "ar"))
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [placementFilter, setPlacementFilter] = useState<AdPlacement | "all">("all")
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" })

  const loadAds = useCallback(async () => {
    setAds((prev) => mergePublicAdsWithFashionDemos(prev, locale))
    setLoading(true)
    try {
      const res = await fetch(`/api/ads?locale=${locale}`, { cache: "no-store" })
      const data = await res.json()
      setAds(
        mergePublicAdsWithFashionDemos(Array.isArray(data.ads) ? data.ads : [], locale)
      )
    } catch {
      setAds((prev) => mergePublicAdsWithFashionDemos(prev, locale))
    } finally {
      setLoading(false)
    }
  }, [locale])

  useEffect(() => {
    loadAds()
  }, [loadAds])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return ads.filter((ad) => {
      if (placementFilter !== "all" && ad.placement !== placementFilter) return false
      if (!q) return true
      return (
        ad.title.toLowerCase().includes(q) ||
        ad.companyName.toLowerCase().includes(q) ||
        ad.description.toLowerCase().includes(q)
      )
    })
  }, [ads, placementFilter, search])

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-[oklch(0.76_0.19_48/8%)] to-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <motion.div
            ref={headerRef}
            initial={{ opacity: 0, y: 24 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge className="mb-4 bg-[oklch(0.76_0.19_48/15%)] text-[oklch(0.76_0.19_48)] hover:bg-[oklch(0.76_0.19_48/20%)]">
              <Megaphone className="me-1.5 h-3.5 w-3.5" />
              {t("ads.page_badge") || (isAr ? "إعلانات CIAR" : "CIAR Ads")}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t("ads.page_title") || (isAr ? "جميع الإعلانات" : "All Advertisements")}
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              {t("ads.page_subtitle") ||
                (isAr
                  ? "استكشف الإعلانات النشطة على منصة CIAR — عروض، شركاء، وخدمات مميزة"
                  : "Explore active ads on CIAR — offers, partners, and featured services")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button className="btn-gold rounded-full px-6" onClick={() => navigate({ page: "advertise" })}>
                <Plus className="h-4 w-4 me-2" />
                {t("nav.advertise") || (isAr ? "أعلن معنا" : "Advertise with us")}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("ads.search_placeholder") || (isAr ? "ابحث في الإعلانات..." : "Search ads...")}
              className="ps-10 rounded-xl"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Button
              size="sm"
              variant={placementFilter === "all" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setPlacementFilter("all")}
            >
              {isAr ? "الكل" : "All"}
            </Button>
            {AD_PLACEMENTS.map((placement) => (
              <Button
                key={placement}
                size="sm"
                variant={placementFilter === placement ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setPlacementFilter(placement)}
              >
                {getPlacementLabel(placement, isAr ? "ar" : "en")}
              </Button>
            ))}
          </div>
        </div>

        {!loading && filtered.length > 0 ? (
          <p className="mb-6 text-sm text-muted-foreground">
            {isAr ? `عرض ${filtered.length} إعلان` : `Showing ${filtered.length} ads`}
          </p>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 py-20 text-center">
            <Megaphone className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium text-foreground">
              {t("ads.empty_title") || (isAr ? "لا إعلانات مطابقة" : "No matching ads")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("ads.empty_subtitle") ||
                (isAr ? "جرّب تغيير البحث أو كن أول مُعلِن" : "Try another search or be the first advertiser")}
            </p>
            <Button className="mt-6 rounded-full" onClick={() => navigate({ page: "advertise" })}>
              {t("nav.advertise") || (isAr ? "أعلن معنا" : "Advertise with us")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((ad) => (
              <AdListingCard key={ad.id} ad={ad} isAr={isAr} />
            ))}
          </div>
        )}

        <div className="mt-16 rounded-2xl border border-[oklch(0.76_0.19_48/20%)] bg-[oklch(0.76_0.19_48/6%)] p-8 text-center">
          <h2 className="text-xl font-bold text-foreground">
            {t("ads.cta_title") || (isAr ? "هل تريد إعلانك هنا؟" : "Want your ad here?")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            {t("ads.cta_subtitle") ||
              (isAr
                ? "اختر الموضع والمدة وابدأ حملتك — فريقنا يراجع طلبك وينشره بعد الموافقة"
                : "Pick placement and duration — we review and publish after approval")}
          </p>
          <Button className="btn-gold mt-6 rounded-full px-8" onClick={() => navigate({ page: "advertise" })}>
            {t("nav.advertise") || (isAr ? "أعلن معنا" : "Advertise with us")}
          </Button>
        </div>
      </section>
    </div>
  )
}
