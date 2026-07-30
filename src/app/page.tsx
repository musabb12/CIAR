"use client"

import { useState, useEffect, useCallback, lazy, Suspense } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useI18n } from "@/lib/i18n-context"
import { useRouter } from "@/lib/router-context"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { FloatingWhatsAppButton } from "@/components/layout/floating-whatsapp-button"
import { Skeleton } from "@/components/ui/skeleton"
import { SuperPlatformHome } from "@/components/super-platform/super-platform-home"
import { PlatformDetailsPage } from "@/components/super-platform/platform-details-page"
import { AdminLoginPage } from "@/components/pages/admin-login-page"
import { UserAuthPage } from "@/components/pages/user-auth-page"
import type { HomeBannersConfig } from "@/lib/home-banners"
import { DEFAULT_NEWS_TICKER_STYLE } from "@/lib/news-ticker"
import { DEFAULT_PAGE_HEADERS, type PageHeadersStore } from "@/lib/page-headers"

const HomePage = lazy(() => import("@/components/pages/home-page").then(m => ({ default: m.HomePage })))
const ProjectsPage = lazy(() => import("@/components/pages/projects-page").then(m => ({ default: m.ProjectsPage })))
const ProjectDetailsPage = lazy(() => import("@/components/pages/project-details-page").then(m => ({ default: m.ProjectDetailsPage })))
const AboutPage = lazy(() => import("@/components/pages/about-page").then(m => ({ default: m.AboutPage })))
const ContactPage = lazy(() => import("@/components/pages/contact-page").then(m => ({ default: m.ContactPage })))
const AdvertisePage = lazy(() => import("@/components/pages/advertise-page").then(m => ({ default: m.AdvertisePage })))
const AdsPage = lazy(() => import("@/components/pages/ads-page").then(m => ({ default: m.AdsPage })))
const FittingRoomPage = lazy(() => import("@/components/pages/fitting-room-page").then(m => ({ default: m.FittingRoomPage })))
const PrivacyPolicyPage = lazy(() => import("@/components/pages/legal-page").then(m => ({ default: m.PrivacyPolicyPage })))
const TermsPage = lazy(() => import("@/components/pages/legal-page").then(m => ({ default: m.TermsPage })))
const SubscriptionPage = lazy(() => import("@/components/pages/subscription-page").then(m => ({ default: m.SubscriptionPage })))
const SubscriptionPaymentPage = lazy(() => import("@/components/pages/subscription-payment-page").then(m => ({ default: m.SubscriptionPaymentPage })))
const AdminPage = lazy(() => import("@/components/pages/admin-page").then(m => ({ default: m.AdminPage })))

const DEFAULT_HOME_BANNERS: HomeBannersConfig = {
  nav: {
    logoType: "image",
    logoUrl: "/logo.png",
    logoVideoUrl: "",
    logoAlt: { ar: "CIAR", en: "CIAR" },
  },
  hero: {
    title: { ar: "", en: "" },
    subtitle: { ar: "", en: "" },
    ctaPrimary: { ar: "", en: "" },
    ctaPrimaryHref: "projects",
    ctaSecondary: { ar: "", en: "" },
    ctaSecondaryHref: "about",
    backgroundType: "image",
    backgroundVideoUrl: "",
    backgroundVideoPoster: "",
    imageSlides: [],
  },
  newsTickerItems: [],
  newsTickerStyle: DEFAULT_NEWS_TICKER_STYLE,
}

interface Project {
  id: string
  slug: string
  imageUrl: string
  imageUrls?: string[]
  category: string
  featured: boolean
  published: boolean
  externalUrl: string
  tags: string
  views: number
  createdAt: string
  translations: { locale: string; name: string; tagline: string; description: string }[]
}

const PageSkeleton = () => (
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 space-y-6">
    <Skeleton className="h-12 w-64 mx-auto" />
    <Skeleton className="h-6 w-96 mx-auto" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-80 rounded-2xl" />
      ))}
    </div>
  </div>
)

export default function Page() {
  const { locale, dir } = useI18n()
  const { route, navigate } = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState({ totalProjects: 0, totalViews: 0, totalCategories: 0 })
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [homeBanners, setHomeBanners] = useState<HomeBannersConfig>(DEFAULT_HOME_BANNERS)
  const [pageHeaders, setPageHeaders] = useState<PageHeadersStore>(DEFAULT_PAGE_HEADERS)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects?locale=${locale}`)
      const data = await res.json()
      const projectData = Array.isArray(data) ? data : data.projects || []
      const categoryData = Array.isArray(data)
        ? Array.from(new Set(projectData.map((p: Project) => p.category).filter(Boolean)))
        : data.categories || []
      const totalViews = projectData.reduce(
        (sum: number, project: Project) => sum + (Number(project.views) || 0),
        0
      )
      setProjects(projectData)
      setCategories(categoryData)
      setStats({
        ...(Array.isArray(data)
          ? { totalProjects: projectData.length, totalViews }
          : data.stats || { totalProjects: 0, totalViews: 0 }),
        totalCategories: categoryData.length,
      })

      try {
        const bannersRes = await fetch("/api/home/banners")
        const bannersData = bannersRes.ok ? await bannersRes.json() : {}
        if (bannersData?.config) {
          setHomeBanners(bannersData.config as HomeBannersConfig)
        }
      } catch {
        setHomeBanners(DEFAULT_HOME_BANNERS)
      }

      try {
        const headersRes = await fetch("/api/page-headers", { cache: "no-store" })
        const headersData = headersRes.ok ? await headersRes.json() : {}
        if (headersData?.headers) {
          setPageHeaders(headersData.headers)
        }
      } catch {
        setPageHeaders(DEFAULT_PAGE_HEADERS)
      }

    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [locale])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchData])

  useEffect(() => {
    document.documentElement.dir = dir
    document.documentElement.lang = locale
  }, [dir, locale])

  const isAdmin = route.page === "admin" || route.page === "admin-login" || route.page === "user-auth"
  const isAdminAuthenticated = String(user?.role || "").toUpperCase() === "ADMIN"
  const publishedProjects = projects.filter((p) => p.published !== false)
  const homeProjects = publishedProjects.length > 0 ? publishedProjects : projects

  useEffect(() => {
    if (authLoading) return
    if (route.page === "admin" && !isAdminAuthenticated) {
      navigate({ page: "admin-login" })
    }
  }, [route.page, isAdminAuthenticated, authLoading, navigate])

  return (
    <div className="min-h-screen flex flex-col" dir={dir}>
      {!isAdmin && (
        <Navbar
          homeConfig={homeBanners}
          newsTickerItems={homeBanners.newsTickerItems}
          newsTickerStyle={homeBanners.newsTickerStyle}
          showNewsTickerStrip={route.page === "home"}
        />
      )}

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {route.page === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<PageSkeleton />}>
                <HomePage
                  featuredProjects={homeProjects}
                  homeConfig={homeBanners}
                  headerConfig={pageHeaders.home}
                />
              </Suspense>
            </motion.div>
          )}

          {route.page === "projects" && (
            <motion.div
              key="projects"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<PageSkeleton />}>
                <SuperPlatformHome headerConfig={pageHeaders.projects} />
              </Suspense>
            </motion.div>
          )}

          {route.page === "project" && (
            <motion.div
              key={`project-${route.slug}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<PageSkeleton />}>
                <ProjectDetailsPage slug={route.slug} />
              </Suspense>
            </motion.div>
          )}

          {route.page === "platform" && (
            <motion.div
              key={`platform-${route.slug}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<PageSkeleton />}>
                <PlatformDetailsPage slug={route.slug} />
              </Suspense>
            </motion.div>
          )}

          {route.page === "about" && (
            <motion.div
              key="about"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<PageSkeleton />}>
                <AboutPage headerConfig={pageHeaders.about} />
              </Suspense>
            </motion.div>
          )}

          {route.page === "contact" && (
            <motion.div
              key="contact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<PageSkeleton />}>
                <ContactPage headerConfig={pageHeaders.contact} />
              </Suspense>
            </motion.div>
          )}

          {route.page === "advertise" && (
            <motion.div
              key="advertise"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<PageSkeleton />}>
                <AdvertisePage />
              </Suspense>
            </motion.div>
          )}

          {route.page === "ads" && (
            <motion.div
              key="ads"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<PageSkeleton />}>
                <AdsPage />
              </Suspense>
            </motion.div>
          )}

          {route.page === "fitting-room" && (
            <motion.div
              key="fitting-room"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<PageSkeleton />}>
                <FittingRoomPage />
              </Suspense>
            </motion.div>
          )}

          {route.page === "privacy" && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<PageSkeleton />}>
                <PrivacyPolicyPage />
              </Suspense>
            </motion.div>
          )}

          {route.page === "terms" && (
            <motion.div
              key="terms"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<PageSkeleton />}>
                <TermsPage />
              </Suspense>
            </motion.div>
          )}

          {route.page === "subscription" && (
            <motion.div key="subscription" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Suspense fallback={<PageSkeleton />}>
                <SubscriptionPage />
              </Suspense>
            </motion.div>
          )}

          {route.page === "subscription-payment" && (
            <motion.div key="subscription-payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Suspense fallback={<PageSkeleton />}>
                <SubscriptionPaymentPage />
              </Suspense>
            </motion.div>
          )}

          {route.page === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<PageSkeleton />}>
                {isAdminAuthenticated ? <AdminPage /> : null}
              </Suspense>
            </motion.div>
          )}

          {route.page === "admin-login" && (
            <motion.div
              key="admin-login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<PageSkeleton />}>
                <AdminLoginPage />
              </Suspense>
            </motion.div>
          )}

          {route.page === "user-auth" && (
            <motion.div
              key="user-auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<PageSkeleton />}>
                <UserAuthPage />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {!isAdmin && <Footer />}
      {!isAdmin && <FloatingWhatsAppButton />}
    </div>
  )
}
