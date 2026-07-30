"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence, useMotionValue, animate, useReducedMotion } from "framer-motion"
import {
  LayoutDashboard,
  BarChart3,
  Activity,
  FolderOpen,
  Settings,
  Menu,
  X,
  Mail,
  Megaphone,
  SendHorizonal,
  Users,
  Image,
  Wallpaper,
  Palette,
  Search,
  Globe,
  Clapperboard,
  Crown,
  Film,
  Building2,
  Newspaper,
  Bot,
  FileDown,
  PanelRightClose,
  PanelRightOpen,
  Heading,
  Scale,
  ScanLine,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useI18n } from "@/lib/i18n-context"
import { AdminHeader } from "./admin-header"
import { SearchCommand } from "./search-command"
import { ThemeSwitcher } from "@/components/layout/theme-switcher"
import { AdminNavContext } from "@/lib/admin-nav-context"
import { useRouter } from "@/lib/router-context"
import { ExternalLink } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface AdminLayoutProps {
  children: React.ReactNode
  activeTab: string
  setTab: (tab: string) => void
}

interface SidebarItem {
  id: string
  icon: LucideIcon
  labelKey: string
  fallback: string
  group: "main" | "content" | "system"
}

/* ─── Sidebar Config ─────────────────────────────────────────────────────── */

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "overview", icon: LayoutDashboard, labelKey: "admin.dashboard", fallback: "لوحة التحكم", group: "main" },
  { id: "analytics", icon: BarChart3, labelKey: "admin.analytics", fallback: "التحليلات والزيارات", group: "main" },
  { id: "activity", icon: Activity, labelKey: "admin.activity_log", fallback: "سجل النشاط", group: "main" },
  { id: "projects", icon: FolderOpen, labelKey: "admin.projects", fallback: "المشاريع والمنصات", group: "content" },
  { id: "media", icon: Image, labelKey: "admin.media", fallback: "مكتبة الوسائط", group: "content" },
  { id: "backgrounds", icon: Wallpaper, labelKey: "admin.backgrounds", fallback: "خلفيات الصفحات", group: "content" },
  { id: "page-headers", icon: Heading, labelKey: "admin.page_headers", fallback: "هيدر الصفحات", group: "content" },
  { id: "home-banners", icon: Clapperboard, labelKey: "admin.home_banners", fallback: "بنرات الصفحة الرئيسية", group: "content" },
  { id: "image-strip", icon: Film, labelKey: "admin.image_strip", fallback: "شريط الصور", group: "content" },
  { id: "home-about-brief", icon: Building2, labelKey: "admin.home_about_brief", fallback: "نبذة عن CIAR", group: "content" },
  { id: "about-content", icon: Building2, labelKey: "admin.about_content", fallback: "محتوى من نحن", group: "content" },
  { id: "legal-pages", icon: Scale, labelKey: "admin.legal_pages", fallback: "الصفحات القانونية", group: "content" },
  { id: "contacts", icon: Mail, labelKey: "admin.contacts", fallback: "رسائل التواصل", group: "content" },
  { id: "ads", icon: Megaphone, labelKey: "admin.ads", fallback: "إدارة الإعلانات", group: "content" },
  { id: "fitting-room", icon: ScanLine, labelKey: "admin.fitting_room", fallback: "غرفة القياس", group: "content" },
  { id: "subscriptions", icon: Crown, labelKey: "admin.subscriptions", fallback: "اشتراكات المُعلِنين", group: "content" },
  { id: "campaigns", icon: SendHorizonal, labelKey: "admin.campaigns", fallback: "حملات البريد", group: "content" },
  { id: "users", icon: Users, labelKey: "admin.users", fallback: "المستخدمون والصلاحيات", group: "content" },
  { id: "news-ticker", icon: Newspaper, labelKey: "admin.news_ticker", fallback: "الشريط الإخباري", group: "system" },
  { id: "ai", icon: Bot, labelKey: "admin.ai", fallback: "الذكاء الاصطناعي", group: "system" },
  { id: "seo", icon: Globe, labelKey: "admin.seo", fallback: "تهيئة محركات البحث", group: "system" },
  { id: "appearance", icon: Palette, labelKey: "admin.appearance", fallback: "المظهر والألوان", group: "system" },
  { id: "settings", icon: Settings, labelKey: "admin.settings", fallback: "إعدادات الموقع", group: "system" },
  { id: "data-export", icon: FileDown, labelKey: "admin.data_export", fallback: "تصدير واستيراد", group: "system" },
]

const GROUP_LABELS: Record<string, string> = {
  main: "admin.group_dashboard",
  content: "admin.group_content",
  system: "admin.group_system",
}

/* ─── Sidebar Nav ────────────────────────────────────────────────────────── */

function SidebarNav({
  activeTab,
  setTab,
  onNavigate,
  collapsed,
  activityCount,
  unreadContacts,
  pendingAdsCount,
}: {
  activeTab: string
  setTab: (tab: string) => void
  onNavigate?: () => void
  collapsed: boolean
  activityCount: number
  unreadContacts: boolean
  pendingAdsCount: number
}) {
  const { t } = useI18n()

  const mainItems = SIDEBAR_ITEMS.filter((i) => i.group === "main")
  const contentItems = SIDEBAR_ITEMS.filter((i) => i.group === "content")
  const systemItems = SIDEBAR_ITEMS.filter((i) => i.group === "system")

  const renderGroup = (labelKey: string, items: SidebarItem[]) => {
    if (collapsed) {
      return (
        <div className="flex flex-col items-center gap-0.5 py-1">
          {items.map((tab) => (
            <SidebarButton
              key={tab.id}
              tab={tab}
              activeTab={activeTab}
              setTab={setTab}
              onNavigate={onNavigate}
              t={t}
              collapsed={collapsed}
              activityCount={tab.id === "activity" ? activityCount : tab.id === "ads" ? pendingAdsCount : 0}
              showDot={tab.id === "contacts" && unreadContacts}
            />
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-0.5">
        {items.map((tab) => (
          <SidebarButton
            key={tab.id}
            tab={tab}
            activeTab={activeTab}
            setTab={setTab}
            onNavigate={onNavigate}
            t={t}
            collapsed={collapsed}
            activityCount={tab.id === "activity" ? activityCount : tab.id === "ads" ? pendingAdsCount : 0}
            showDot={tab.id === "contacts" && unreadContacts}
          />
        ))}
      </div>
    )
  }

  const allItems = [...mainItems, ...contentItems, ...systemItems]

  return (
    <nav
      className={`min-h-0 flex-1 space-y-0.5 overflow-y-auto py-3 scrollbar-none ${collapsed ? "px-2" : "px-3"}`}
    >
      {collapsed ? renderGroup(GROUP_LABELS.main, allItems) : renderGroup(GROUP_LABELS.main, allItems)}
    </nav>
  )
}

/* ─── Sidebar Button ─────────────────────────────────────────────────────── */

function SidebarButton({
  tab,
  activeTab,
  setTab,
  onNavigate,
  t,
  collapsed,
  activityCount,
  showDot,
}: {
  tab: SidebarItem
  activeTab: string
  setTab: (tab: string) => void
  onNavigate?: () => void
  t: (key: string) => string
  collapsed: boolean
  activityCount: number
  showDot: boolean
}) {
  const { dir } = useI18n()
  const isActive = activeTab === tab.id
  const Icon = tab.icon
  const label = t(tab.labelKey) || tab.fallback

  const buttonContent = (
    <button
      onClick={() => {
        setTab(tab.id)
        onNavigate?.()
      }}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        collapsed ? "justify-center px-0" : "",
        isActive
          ? "bg-gradient-to-l from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"
      )}
      aria-label={label}
    >
      <div className="relative shrink-0">
        <Icon
          className={cn(
            "h-4 w-4",
            isActive ? "text-white" : "text-slate-500 dark:text-slate-400"
          )}
        />
        {/* Badge count for Activity Log */}
        {activityCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className={`absolute -end-1.5 -top-1.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-none border border-primary/30 bg-primary px-1 text-[8px] font-bold text-primary-foreground shadow-sm ${
              collapsed ? "-end-2.5 -top-1" : ""
            }`}
          >
            {activityCount > 99 ? "99+" : activityCount}
          </motion.span>
        )}
        {/* Unread dot for Contacts */}
        {showDot && (
          <span className={`absolute end-0 top-0 h-2 w-2 rounded-none bg-[#ea580c] ring-1 ring-[#7c2d12] ${collapsed ? "-end-1" : ""}`}>
            <span className="absolute inset-0 animate-ping rounded-none bg-[#fb923c] opacity-40" />
          </span>
        )}
      </div>
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  )

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent
            side={dir === "rtl" ? "right" : "left"}
            sideOffset={10}
            className="rounded-lg text-xs font-medium shadow-[0_10px_28px_-8px_rgba(0,0,0,0.2)]"
          >
            {label}
            {activityCount > 0 && (
              <span className="ms-1.5 font-semibold text-primary">({activityCount})</span>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return buttonContent
}

/* ─── Swipe-to-Close Mobile Drawer ───────────────────────────────────────── */

function MobileDrawer({
  open,
  onClose,
  dir,
  children,
}: {
  open: boolean
  onClose: () => void
  dir: "ltr" | "rtl"
  children: React.ReactNode
}) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)

  /** Drawer is docked to the physical right; drag further right to dismiss */
  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const threshold = 80
      const shouldClose = info.offset.x > threshold || info.velocity.x > 400
      if (shouldClose) {
        onClose()
      } else {
        animate(x, 0, { type: "spring", damping: 25, stiffness: 300 })
      }
    },
    [onClose, x]
  )

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-[#44403c]/25 backdrop-blur-[2px] lg:hidden"
            onClick={onClose}
          />
          <motion.aside
            ref={drawerRef}
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.3, right: 0.3 }}
            onDragEnd={handleDragEnd}
            style={{ x }}
            dir={dir}
            className="admin-pro-drawer fixed bottom-2 right-2 top-16 z-50 flex w-[280px] flex-col rounded-2xl border border-slate-200 bg-white backdrop-blur-xl will-change-transform touch-none dark:border-white/10 dark:bg-[#0d1324] lg:hidden"
          >
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

/* ─── Main Layout Component ──────────────────────────────────────────────── */

export function AdminLayout({ children, activeTab, setTab }: AdminLayoutProps) {
  const { t, dir, locale, setLocale } = useI18n()
  const { navigate } = useRouter()
  const { resolvedTheme } = useTheme()
  const [themeMounted, setThemeMounted] = useState(false)

  useEffect(() => {
    setThemeMounted(true)
  }, [])

  useEffect(() => {
    document.body.classList.add("ciar-admin-active")
    return () => document.body.classList.remove("ciar-admin-active")
  }, [])

  const isDark = themeMounted && resolvedTheme === "dark"

  useEffect(() => {
    if (locale !== "ar") setLocale("ar")
  }, [locale, setLocale])
  const reduceMotion = useReducedMotion()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activityCount, setActivityCount] = useState(0)
  const [unreadContacts, setUnreadContacts] = useState(false)
  const [pendingAdsCount, setPendingAdsCount] = useState(0)

  // Fetch activity count, unread contacts, and pending ad requests on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/activity-log?limit=10")
        const data = await res.json()
        const activities = data.activities || []
        setActivityCount(activities.length)
      } catch {
        // silent
      }

      try {
        const res = await fetch("/api/admin/contacts")
        const data = await res.json()
        const contacts = data.contacts || data || []
        setUnreadContacts(
          Array.isArray(contacts) && contacts.some((c: { read?: boolean }) => !c.read)
        )
      } catch {
        // silent
      }

      try {
        const res = await fetch("/api/admin/ads")
        const data = await res.json()
        const pending = data.pending || []
        setPendingAdsCount(Array.isArray(pending) ? pending.length : 0)
      } catch {
        // silent
      }
    }
    fetchData()
  }, [])

  const closeMobile = () => setMobileOpen(false)

  const sidebarWidth = sidebarCollapsed ? 64 : 260

  const isOverview = activeTab === "overview"

  return (
    <AdminNavContext.Provider value={{ setTab }}>
    <div
      dir={dir}
      lang={locale}
      data-admin-lux-layout
      data-admin-pro
      className={cn(
        "admin-pro-bg relative flex min-h-screen overflow-x-hidden selection:bg-orange-500/25",
        isDark
          ? "dark bg-[#0a0f1e] text-slate-200 selection:text-white"
          : "bg-[#f4f6fb] text-slate-900 selection:text-slate-900"
      )}
    >
      {/* ── Desktop Sidebar (يمين الشاشة — ثابت فيزيائياً) ── */}
      <motion.aside
        animate={{ width: sidebarWidth }}
        transition={{ type: "spring", damping: 32, stiffness: 280 }}
        className={cn(
          "admin-pro-sidebar fixed bottom-0 right-0 top-0 z-20 hidden min-h-0 min-w-0 shrink-0 flex-col overflow-hidden border-l lg:flex",
          "border-slate-200 bg-white text-slate-900 shadow-sm",
          "dark:border-white/5 dark:bg-[#0d1324] dark:text-white dark:shadow-none"
        )}
      >
        {/* Logo Area */}
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="border-b border-slate-200 px-4 py-4 dark:border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25">
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t("admin.dashboard") || "لوحة التحكم"}
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t("admin.management") || "إدارة المنصات"}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {sidebarCollapsed && (
          <div className="flex justify-center border-b border-slate-200 p-3 dark:border-white/5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
          </div>
        )}

        <SidebarNav
          activeTab={activeTab}
          setTab={setTab}
          collapsed={sidebarCollapsed}
          activityCount={activityCount}
          unreadContacts={unreadContacts}
          pendingAdsCount={pendingAdsCount}
        />

        {/* Sidebar footer */}
        <div className="space-y-2 border-t border-slate-200 p-3 dark:border-white/5">
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={() => navigate({ page: "home" })}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t("admin.back_to_site") || "العودة للموقع"}
            </button>
          )}
          <div
            className={cn(
              "flex items-center rounded-xl border px-3 py-2",
              "border-slate-200 bg-slate-50",
              "dark:border-white/5 dark:bg-white/[0.03]",
              sidebarCollapsed ? "justify-center" : "justify-between"
            )}
          >
            {!sidebarCollapsed && (
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {t("admin.theme_mode") || "الوضع الليلي / النهاري"}
              </span>
            )}
            <ThemeSwitcher />
          </div>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={sidebarCollapsed ? "icon" : "sm"}
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className={cn(
                    "w-full rounded-xl transition-all",
                    sidebarCollapsed
                      ? "h-8 w-8"
                      : "justify-center gap-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                  )}
                >
                  {sidebarCollapsed ? (
                    <PanelRightOpen className="h-4 w-4" />
                  ) : (
                    <>
                      <PanelRightClose className="h-4 w-4" />
                      <span className="text-xs font-semibold">{t("admin.collapse") || "طي"}</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              {sidebarCollapsed && (
                <TooltipContent
                  side={dir === "rtl" ? "right" : "left"}
                  sideOffset={10}
                  className="rounded-lg text-xs shadow-[0_10px_28px_-8px_rgba(0,0,0,0.2)]"
                >
                  {t("admin.expand") || "توسيع"}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

      </motion.aside>

      {/* ── Mobile Drawer ── */}
      <MobileDrawer open={mobileOpen} onClose={closeMobile} dir={dir}>
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white">{t("admin.dashboard") || "لوحة التحكم"}</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            onClick={closeMobile}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <SidebarNav
          activeTab={activeTab}
          setTab={setTab}
          onNavigate={closeMobile}
          collapsed={false}
          activityCount={activityCount}
          unreadContacts={unreadContacts}
          pendingAdsCount={pendingAdsCount}
        />
        <div className="mt-auto space-y-2 border-t border-slate-200 p-3 dark:border-white/10">
          <button
            type="button"
            onClick={() => {
              navigate({ page: "home" })
              closeMobile()
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("admin.back_to_site") || "العودة للموقع"}
          </button>
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-500">
            {t("admin.swipe_to_close") || "اسحب لليمين للإغلاق"} →
          </p>
        </div>
      </MobileDrawer>

      {/* ── Main Content ── */}
      <motion.main
        animate={{
          marginRight: typeof window !== "undefined" && window.innerWidth >= 1024 ? sidebarWidth : 0,
        }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative z-10 min-w-0 flex-1 max-lg:!mr-0 lg:mr-[260px]"
      >
        {!isOverview && (
          <AdminHeader
            activeTab={activeTab}
            setTab={setTab}
            onMobileMenuToggle={() => setMobileOpen(true)}
            onOpenSearch={() => setSearchOpen(true)}
          />
        )}

        {isOverview && (
          <div
            className={cn(
              "sticky top-0 z-30 flex h-14 items-center border-b px-4 backdrop-blur-sm lg:hidden",
              isDark
                ? "border-white/5 bg-[#0a0f1e]/95"
                : "border-slate-200 bg-white/95"
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8",
                isDark
                  ? "text-slate-300 hover:bg-white/10 hover:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <span
              className={cn(
                "ms-2 text-sm font-semibold",
                isDark ? "text-white" : "text-slate-900"
              )}
            >
              {t("admin.dashboard") || "لوحة التحكم"}
            </span>
          </div>
        )}

        <div className={isOverview ? "px-4 pb-8 pt-4 sm:px-6 lg:px-8" : "px-4 pb-6 pt-4 sm:px-6 sm:pb-8 lg:px-8 lg:pb-10"}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14, scale: 0.988 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.992 }}
              transition={
                reduceMotion
                  ? { duration: 0.15 }
                  : { type: "spring", stiffness: 320, damping: 28, mass: 0.85 }
              }
              className={
                isOverview
                  ? "mx-auto max-w-7xl"
                  : cn(
                      "admin-pro-tab-surface mx-auto max-w-7xl rounded-2xl border p-5 backdrop-blur-sm sm:p-7",
                      isDark
                        ? "border-white/8 bg-[#111827]/80"
                        : "border-slate-200 bg-white shadow-sm"
                    )
              }
            >
              <div className="admin-modern-tabs relative">{children}</div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>

      {/* ── Search Command Palette ── */}
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} onNavigate={setTab} />
    </div>
    </AdminNavContext.Provider>
  )
}
