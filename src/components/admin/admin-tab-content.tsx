"use client"

import { lazy, Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { isSectionContentTab } from "@/lib/section-admin-registry"

const OverviewTab = lazy(() => import("@/components/admin/overview-tab").then((m) => ({ default: m.OverviewTab })))
const AnalyticsTab = lazy(() => import("@/components/admin/analytics-tab").then((m) => ({ default: m.AnalyticsTab })))
const ActivityTab = lazy(() => import("@/components/admin/activity-tab").then((m) => ({ default: m.ActivityTab })))
const ProjectsTab = lazy(() => import("@/components/admin/projects-tab").then((m) => ({ default: m.ProjectsTab })))
const TranslationsTab = lazy(() => import("@/components/admin/translations-tab").then((m) => ({ default: m.TranslationsTab })))
const MediaTab = lazy(() => import("@/components/admin/media-tab").then((m) => ({ default: m.MediaTab })))
const BackgroundsTab = lazy(() => import("@/components/admin/backgrounds-tab").then((m) => ({ default: m.BackgroundsTab })))
const HomeBannersTab = lazy(() => import("@/components/admin/home-banners-tab").then((m) => ({ default: m.HomeBannersTab })))
const ImageStripTab = lazy(() => import("@/components/admin/image-strip-tab").then((m) => ({ default: m.ImageStripTab })))
const AboutContentTab = lazy(() =>
  import("@/components/admin/about-content-tab").then((m) => ({ default: m.AboutContentTab }))
)
const HomeAboutBriefTab = lazy(() =>
  import("@/components/admin/home-about-brief-tab").then((m) => ({ default: m.HomeAboutBriefTab }))
)
const ContactsTab = lazy(() => import("@/components/admin/contacts-tab").then((m) => ({ default: m.ContactsTab })))
const AdsTab = lazy(() => import("@/components/admin/ads-tab").then((m) => ({ default: m.AdsTab })))
const FittingRoomTab = lazy(() =>
  import("@/components/admin/fitting-room-tab").then((m) => ({ default: m.FittingRoomTab }))
)
const SubscriptionsTab = lazy(() => import("@/components/admin/subscriptions-tab").then((m) => ({ default: m.SubscriptionsTab })))
const CampaignsTab = lazy(() => import("@/components/admin/campaigns-tab").then((m) => ({ default: m.CampaignsTab })))
const UsersTab = lazy(() => import("@/components/admin/users-tab").then((m) => ({ default: m.UsersTab })))
const NewsTickerTab = lazy(() => import("@/components/admin/news-ticker-tab").then((m) => ({ default: m.NewsTickerTab })))
const AiTab = lazy(() => import("@/components/admin/ai-tab").then((m) => ({ default: m.AiTab })))
const SeoTab = lazy(() => import("@/components/admin/seo-tab").then((m) => ({ default: m.SeoTab })))
const AppearanceTab = lazy(() => import("@/components/admin/appearance-tab").then((m) => ({ default: m.AppearanceTab })))
const SiteSettingsTab = lazy(() => import("@/components/admin/site-settings-tab").then((m) => ({ default: m.SiteSettingsTab })))
const DataExportTab = lazy(() => import("@/components/admin/data-export-tab").then((m) => ({ default: m.DataExportTab })))
const SectionContentTab = lazy(() =>
  import("@/components/admin/section-content-tab").then((m) => ({ default: m.SectionContentTab }))
)
const PageHeadersTab = lazy(() =>
  import("@/components/admin/page-headers-tab").then((m) => ({ default: m.PageHeadersTab }))
)
const LegalPagesTab = lazy(() =>
  import("@/components/admin/legal-pages-tab").then((m) => ({ default: m.LegalPagesTab }))
)

export function AdminTabSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48 rounded-xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  )
}

export function AdminTabContent({ activeTab }: { activeTab: string }) {
  switch (activeTab) {
    case "overview":
      return <OverviewTab />
    case "analytics":
      return <AnalyticsTab />
    case "activity":
      return <ActivityTab />
    case "projects":
      return <ProjectsTab />
    case "translations":
      return <TranslationsTab />
    case "media":
      return <MediaTab />
    case "backgrounds":
      return <BackgroundsTab />
    case "page-headers":
      return <PageHeadersTab />
    case "home-banners":
      return <HomeBannersTab />
    case "image-strip":
      return <ImageStripTab />
    case "about-content":
      return <AboutContentTab />
    case "home-about-brief":
      return <HomeAboutBriefTab />
    case "legal-pages":
      return <LegalPagesTab />
    case "contacts":
      return <ContactsTab />
    case "ads":
      return <AdsTab />
    case "fitting-room":
      return <FittingRoomTab />
    case "subscriptions":
      return <SubscriptionsTab />
    case "campaigns":
      return <CampaignsTab />
    case "users":
      return <UsersTab />
    case "news-ticker":
      return <NewsTickerTab />
    case "ai":
      return <AiTab />
    case "seo":
      return <SeoTab />
    case "appearance":
      return <AppearanceTab />
    case "settings":
      return <SiteSettingsTab />
    case "data-export":
      return <DataExportTab />
    default:
      if (isSectionContentTab(activeTab)) {
        return <SectionContentTab tabId={activeTab} />
      }
      return <OverviewTab />
  }
}

export function AdminTabContentSuspended({ activeTab }: { activeTab: string }) {
  return (
    <Suspense fallback={<AdminTabSkeleton />}>
      <AdminTabContent activeTab={activeTab} />
    </Suspense>
  )
}
