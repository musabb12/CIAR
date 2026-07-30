"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import {
  Menu,
  Search,
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  User,
  ChevronDown,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useI18n } from "@/lib/i18n-context"
import { useAuth } from "@/lib/auth-context"
import { useRouter as useHashRouter } from "@/lib/router-context"
import { ThemeSwitcher } from "@/components/layout/theme-switcher"
import { usePathname as useNextPathname, useRouter as useNextRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { getSectionByAdminTab } from "@/lib/section-admin-registry"

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface AdminHeaderProps {
  activeTab: string
  setTab: (tab: string) => void
  onMobileMenuToggle: () => void
  /** Opens the command palette owned by `AdminLayout` */
  onOpenSearch: () => void
}

/* ─── Tab Label Map ──────────────────────────────────────────────────────── */

const TAB_LABELS: Record<string, string> = {
  overview: "admin.dashboard",
  analytics: "admin.analytics",
  activity: "admin.activity_log",
  projects: "admin.projects",
  translations: "admin.translations",
  settings: "admin.settings",
  appearance: "admin.appearance",
  contacts: "admin.contacts",
  ads: "admin.ads",
  "fitting-room": "admin.fitting_room",
  campaigns: "admin.campaigns",
  users: "admin.users",
  media: "admin.media",
  backgrounds: "admin.backgrounds",
  "page-headers": "admin.page_headers",
  "home-banners": "admin.home_banners",
  "image-strip": "admin.image_strip",
  "about-content": "admin.about_content",
  "home-about-brief": "admin.home_about_brief",
  "legal-pages": "admin.legal_pages",
  "news-ticker": "admin.news_ticker",
  ai: "admin.ai",
  seo: "admin.seo",
  "data-export": "admin.data_export",
}

/* ─── Tab Description Map ────────────────────────────────────────────────── */

const TAB_DESCRIPTIONS: Record<string, { key: string; fallback: string }> = {
  overview: { key: "admin.tab_desc_overview", fallback: "Key metrics and quick actions at a glance" },
  analytics: { key: "admin.tab_desc_analytics", fallback: "Traffic, views, and performance insights" },
  activity: { key: "admin.tab_desc_activity", fallback: "Recent system events and admin actions" },
  projects: { key: "admin.tab_desc_projects", fallback: "Manage platforms, content, and publishing" },
  translations: { key: "admin.tab_desc_translations", fallback: "Edit UI strings across all languages" },
  media: { key: "admin.tab_desc_media", fallback: "Upload and manage images, documents, and files" },
  backgrounds: { key: "admin.tab_desc_backgrounds", fallback: "Manage page background images and visual themes" },
  "page-headers": { key: "admin.tab_desc_page_headers", fallback: "Control page hero texts, colors, fonts, and sizes" },
  "home-banners": { key: "admin.tab_desc_home_banners", fallback: "Control homepage banners, logo, hero text, and media" },
  "image-strip": { key: "admin.tab_desc_image_strip", fallback: "Manage the animated image strip below the hero section" },
  "about-content": { key: "admin.tab_desc_about_content", fallback: "Edit the company intro text on the About page" },
  "home-about-brief": { key: "admin.tab_desc_home_about_brief", fallback: "Control homepage about brief texts, colors, fonts, and stats" },
  "legal-pages": { key: "admin.tab_desc_legal_pages", fallback: "Manage privacy policy and terms pages content and typography" },
  contacts: { key: "admin.tab_desc_contacts", fallback: "Review and respond to submitted messages" },
  ads: { key: "admin.tab_desc_ads", fallback: "Manage ad placements, duration, approval, and live preview" },
  "fitting-room": { key: "admin.tab_desc_fitting_room", fallback: "Manage virtual fitting room settings, measurements, and garments" },
  campaigns: { key: "admin.tab_desc_campaigns", fallback: "AI email campaigns with audience segments and batch sending" },
  users: { key: "admin.tab_desc_users", fallback: "Manage user accounts, roles, and permissions" },
  "news-ticker": { key: "admin.tab_desc_news_ticker", fallback: "Edit the scrolling news ticker in hero header" },
  ai: { key: "admin.tab_desc_ai", fallback: "Smart chat, sentiment analysis, SEO suggestions, and automation" },
  seo: { key: "admin.tab_desc_seo", fallback: "Meta tags, social previews, and sitemap" },
  appearance: { key: "admin.tab_desc_appearance", fallback: "Colors, typography, layout, and effects" },
  settings: { key: "admin.tab_desc_settings", fallback: "General configuration and site preferences" },
  "data-export": { key: "admin.tab_desc_data_export", fallback: "Export, import, and backup your data" },
}

/* ─── Live Clock Hook ────────────────────────────────────────────────────── */

function useLiveClock() {
  const [time, setTime] = useState("--:--")
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const h = now.getHours().toString().padStart(2, "0")
      const m = now.getMinutes().toString().padStart(2, "0")
      setTime(`${h}:${m}`)
      // Update every second using rAF for better accuracy
      rafRef.current = window.setTimeout(update, 1000)
    }
    update()
    return () => clearTimeout(rafRef.current)
  }, [])

  return time
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export function AdminHeader({
  activeTab,
  setTab,
  onMobileMenuToggle,
  onOpenSearch,
}: AdminHeaderProps) {
  const { t } = useI18n()
  const { user, logout } = useAuth()
  const { navigate } = useHashRouter()
  const nextPathname = useNextPathname()
  const nextRouter = useNextRouter()
  const { resolvedTheme } = useTheme()
  const [themeMounted, setThemeMounted] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(3)
  const time = useLiveClock()

  useEffect(() => {
    setThemeMounted(true)
  }, [])

  const isDark = themeMounted && resolvedTheme === "dark"

  const handleLogout = () => {
    logout()
    if (nextPathname?.startsWith("/admin/panel")) {
      nextRouter.replace("/admin/login")
      return
    }
    navigate({ page: "admin-login" })
  }

  // Fetch notification count periodically
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/admin/activity-log?limit=10")
        const data = await res.json()
        setNotifCount(Math.min((data.activities || []).length, 3))
      } catch {
        // silent
      }
    }
    const interval = setInterval(fetchCount, 60000)
    fetchCount()
    return () => clearInterval(interval)
  }, [])

  // Close notification panel when clicking outside
  useEffect(() => {
    if (!notifOpen) return
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest("[data-notif-area]")) {
        setNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [notifOpen])

  const currentTabLabel = (() => {
    const sectionEntry = getSectionByAdminTab(activeTab)
    if (sectionEntry) return sectionEntry.titleAr
    return (
      t(TAB_LABELS[activeTab] || "") ||
      t(`admin.${activeTab}`) ||
      activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
    )
  })()

  const tabDesc = TAB_DESCRIPTIONS[activeTab]
  const tabDescriptionText = (() => {
    const sectionEntry = getSectionByAdminTab(activeTab)
    if (sectionEntry) return sectionEntry.descAr
    return tabDesc ? t(tabDesc.key) || tabDesc.fallback : ""
  })()

  return (
    <header
      className={cn(
        "admin-pro-header sticky top-0 z-30 border-b shadow-sm backdrop-blur-md",
        isDark
          ? "border-white/8 bg-[#0a0f1e]/95 text-slate-200"
          : "border-slate-200 bg-white/95 text-slate-900"
      )}
    >
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        {/* ── Left Section ── */}
        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 shrink-0 rounded-lg lg:hidden",
              isDark
                ? "text-slate-300 hover:bg-white/10 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Breadcrumb */}
          <Breadcrumb className="hidden sm:flex">
            <BreadcrumbList className="text-xs">
              <BreadcrumbItem>
                <BreadcrumbLink
                  onClick={() => setTab("overview")}
                  className={cn(
                    "cursor-pointer transition-colors hover:text-orange-500",
                    isDark ? "text-slate-400 hover:text-orange-400" : "text-slate-500"
                  )}
                >
                  {t("admin.title") || "Admin"}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-3 w-3 text-slate-500" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage
                  className={cn(
                    "font-semibold tracking-tight",
                    isDark ? "text-white" : "text-slate-900"
                  )}
                >
                  {currentTabLabel}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Mobile tab label */}
          <span
            className={cn(
              "truncate text-sm font-medium sm:hidden",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            {currentTabLabel}
          </span>
        </div>

        {/* ── Center Section ── */}
        <div className="hidden max-w-sm flex-1 items-center justify-center md:flex">
          <button
            type="button"
            onClick={onOpenSearch}
            className={cn(
              "group flex w-full max-w-xs cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm shadow-sm transition-all duration-300 ease-out",
              isDark
                ? "border border-white/10 bg-white/5 text-slate-400 hover:border-orange-500/30 hover:bg-white/8"
                : "border border-slate-200 bg-slate-50 text-slate-500 hover:border-orange-300 hover:bg-white"
            )}
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-500 transition-colors group-hover:text-orange-400" />
            <span className="flex-1 text-start text-xs text-slate-400">
              {t("admin.search_placeholder") || "Search pages, actions..."}
            </span>
            <motion.kbd
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="hidden items-center gap-0.5 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline-flex"
            >
              <span className="text-[9px]">⌘</span>K
            </motion.kbd>
          </button>
        </div>

        {/* ── Right Section ── */}
        <div className="flex shrink-0 items-center gap-2">
          <ThemeSwitcher />

          {/* Live Clock */}
          <div className="hidden items-center gap-1.5 rounded-lg px-2 py-1 text-slate-400 lg:flex">
            <Clock className="h-3 w-3" />
            <span className="font-mono text-xs tabular-nums tracking-wide">{time}</span>
          </div>

          {/* Divider */}
          <div className="mx-0.5 hidden h-5 w-px bg-white/10 lg:block" />

          {/* Mobile search button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white md:hidden"
            onClick={onOpenSearch}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Notification bell */}
          <div className="relative" data-notif-area>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 text-slate-300 hover:bg-white/10 hover:text-white"
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <Bell className="h-4 w-4" />
              {notifCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="absolute end-1 top-1 flex h-4 w-4 items-center justify-center rounded-none border border-[#7c2d12]/40 bg-gradient-to-b from-[#fb923c] to-[#ea580c] text-[9px] font-bold text-white shadow-[0_2px_0_0_rgba(124,45,12,0.55)]"
                >
                  {notifCount}
                </motion.span>
              )}
            </Button>

            {/* Notification dropdown */}
            {notifOpen && (
              <NotificationDropdown
                count={notifCount}
                onMarkAllRead={() => setNotifCount(0)}
                onClose={() => setNotifOpen(false)}
              />
            )}
          </div>

          {/* Separator */}
          <div className="mx-1 hidden h-6 w-px bg-white/10 sm:block" />

          {/* User avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 gap-2 rounded-lg px-2 text-slate-200 hover:bg-white/10 hover:text-white">
                <Avatar className="h-7 w-7 rounded-lg border border-white/10 shadow-sm">
                  <AvatarImage src="/logo.png" alt={t("admin.title") || "لوحة الإدارة"} />
                  <AvatarFallback className="rounded-lg bg-orange-500/20 text-[11px] font-bold text-orange-300">
                    AD
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-xs font-medium text-white sm:inline">
                  {t("admin.title") || "لوحة الإدارة"}
                </span>
                <ChevronDown className="hidden h-3 w-3 text-slate-400 sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-xl border border-border bg-popover shadow-md"
            >
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">{t("admin.admin_user") || "مدير النظام"}</span>
                  <span className="truncate">{user?.email || user?.phone || "—"}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="cursor-pointer gap-2.5 focus:bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {t("admin.profile") || "الملف الشخصي"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer gap-2.5 focus:bg-muted"
                  onClick={() => setTab("settings")}
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  {t("admin.settings") || "الإعدادات"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                {t("admin.logout") || "تسجيل الخروج"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Tab Description ── */}
      {tabDescriptionText && (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="hidden px-4 pb-3 sm:block sm:px-6"
        >
          <div
            className={cn(
              "rounded-xl border px-3 py-2",
              isDark ? "border-white/8 bg-[#111827]" : "border-slate-200 bg-slate-50"
            )}
          >
            <p className={cn("text-[11px] leading-relaxed", isDark ? "text-slate-400" : "text-slate-600")}>{tabDescriptionText}</p>
          </div>
        </motion.div>
      )}
    </header>
  )
}

/* ─── Inline Notification Dropdown (lightweight) ─────────────────────────── */

function NotificationDropdown({
  count,
  onMarkAllRead,
  onClose,
}: {
  count: number
  onMarkAllRead: () => void
  onClose: () => void
}) {
  const { t } = useI18n()

  return (
    <motion.div
      initial={{ opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "absolute end-0 top-full z-50 mt-1.5 w-72 rounded-xl border border-border",
        "bg-popover",
        "shadow-md"
      )}
      data-notif-area
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-xs font-semibold text-foreground">
          {t("admin.notifications") || "الإشعارات"}
        </span>
        {count > 0 && (
          <button
            onClick={onMarkAllRead}
            className="cursor-pointer text-[10px] font-medium text-primary hover:underline"
          >
            {t("admin.mark_all_read") || "تعليم الكل كمقروء"}
          </button>
        )}
      </div>
      <div className="p-3 text-center">
        <p className="text-xs text-muted-foreground">
          {t("admin.notification_hint") || "افتح لوحة الإشعارات للتفاصيل"}
        </p>
      </div>
    </motion.div>
  )
}
