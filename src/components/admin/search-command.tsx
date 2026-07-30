"use client"

import { useEffect, useCallback } from "react"
import {
  LayoutDashboard,
  BarChart3,
  Activity,
  FolderOpen,
  Settings,
  Building2,
  Search,
  Mail,
  Megaphone,
  SendHorizonal,
  Plus,
  Eye,
  Palette,
  Users,
  FileText,
  Globe,
  Newspaper,
  Bot,
  Wallpaper,
  Film,
  Clapperboard,
  Scale,
  ScanLine,
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useI18n } from "@/lib/i18n-context"

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface SearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate?: (tab: string) => void
}

/* ─── Command Items Config ────────────────────────────────────────────────── */

interface CommandItemConfig {
  id: string
  labelKey: string
  fallback: string
  icon: React.ElementType
  shortcut?: string
  group: "pages" | "actions" | "projects"
  action: (onNavigate?: (tab: string) => void) => void
}

const COMMAND_ITEMS: CommandItemConfig[] = [
  {
    id: "overview",
    labelKey: "admin.cmd_go_dashboard",
    fallback: "Go to Dashboard",
    icon: LayoutDashboard,
    group: "pages",
    action: (nav) => nav?.("overview"),
  },
  {
    id: "analytics",
    labelKey: "admin.cmd_go_analytics",
    fallback: "Go to Analytics",
    icon: BarChart3,
    group: "pages",
    action: (nav) => nav?.("analytics"),
  },
  {
    id: "activity",
    labelKey: "admin.cmd_go_activity",
    fallback: "Go to Activity Log",
    icon: Activity,
    group: "pages",
    action: (nav) => nav?.("activity"),
  },
  {
    id: "projects",
    labelKey: "admin.cmd_go_projects",
    fallback: "Go to Projects",
    icon: FolderOpen,
    group: "pages",
    action: (nav) => nav?.("projects"),
  },
  {
    id: "backgrounds",
    labelKey: "admin.cmd_go_backgrounds",
    fallback: "Go to Backgrounds",
    icon: Wallpaper,
    group: "pages",
    action: (nav) => nav?.("backgrounds"),
  },
  {
    id: "page-headers",
    labelKey: "admin.cmd_go_page_headers",
    fallback: "Go to Page Headers",
    icon: FileText,
    group: "pages",
    action: (nav) => nav?.("page-headers"),
  },
  {
    id: "news-ticker",
    labelKey: "admin.cmd_go_news_ticker",
    fallback: "Go to News Ticker",
    icon: Newspaper,
    group: "pages",
    action: (nav) => nav?.("news-ticker"),
  },
  {
    id: "ai",
    labelKey: "admin.cmd_go_ai",
    fallback: "Go to AI Settings",
    icon: Bot,
    group: "pages",
    action: (nav) => nav?.("ai"),
  },
  {
    id: "legal-pages",
    labelKey: "admin.cmd_go_legal_pages",
    fallback: "Go to Legal Pages",
    icon: Scale,
    group: "pages",
    action: (nav) => nav?.("legal-pages"),
  },
  {
    id: "home-about-brief",
    labelKey: "admin.cmd_go_home_about_brief",
    fallback: "Go to Home About Brief",
    icon: Building2,
    group: "pages",
    action: (nav) => nav?.("home-about-brief"),
  },
  {
    id: "about-content",
    labelKey: "admin.cmd_go_about_content",
    fallback: "Go to About Content",
    icon: Building2,
    group: "pages",
    action: (nav) => nav?.("about-content"),
  },
  {
    id: "image-strip",
    labelKey: "admin.cmd_go_image_strip",
    fallback: "Go to Image Strip",
    icon: Film,
    group: "pages",
    action: (nav) => nav?.("image-strip"),
  },
  {
    id: "home-banners",
    labelKey: "admin.cmd_go_home_banners",
    fallback: "Go to Home Banners",
    icon: Clapperboard,
    group: "pages",
    action: (nav) => nav?.("home-banners"),
  },
  {
    id: "settings",
    labelKey: "admin.cmd_go_settings",
    fallback: "Go to Settings",
    icon: Settings,
    group: "pages",
    action: (nav) => nav?.("settings"),
  },
  {
    id: "appearance",
    labelKey: "admin.cmd_go_appearance",
    fallback: "Go to Appearance",
    icon: Palette,
    group: "pages",
    action: (nav) => nav?.("appearance"),
  },
  {
    id: "contacts",
    labelKey: "admin.cmd_go_contacts",
    fallback: "Go to Contacts",
    icon: Mail,
    group: "pages",
    action: (nav) => nav?.("contacts"),
  },
  {
    id: "ads",
    labelKey: "admin.cmd_go_ads",
    fallback: "Go to Ads",
    icon: Megaphone,
    group: "pages",
    action: (nav) => nav?.("ads"),
  },
  {
    id: "fitting-room",
    labelKey: "admin.cmd_go_fitting_room",
    fallback: "Go to Virtual Fitting Room",
    icon: ScanLine,
    group: "pages",
    action: (nav) => nav?.("fitting-room"),
  },
  {
    id: "campaigns",
    labelKey: "admin.cmd_go_campaigns",
    fallback: "Go to Email Campaigns",
    icon: SendHorizonal,
    group: "pages",
    action: (nav) => nav?.("campaigns"),
  },
  // Actions
  {
    id: "new-project",
    labelKey: "admin.cmd_add_project",
    fallback: "Add New Project",
    icon: Plus,
    group: "actions",
    action: (nav) => nav?.("projects"),
  },
  {
    id: "view-analytics",
    labelKey: "admin.cmd_view_analytics",
    fallback: "View Analytics",
    icon: Eye,
    group: "actions",
    action: (nav) => nav?.("analytics"),
  },
  {
    id: "manage-users",
    labelKey: "admin.cmd_manage_users",
    fallback: "Manage Users",
    icon: Users,
    group: "actions",
    action: () => {},
  },
  {
    id: "export-data",
    labelKey: "admin.cmd_export_data",
    fallback: "Export Data",
    icon: FileText,
    group: "actions",
    action: () => {},
  },
  {
    id: "change-locale",
    labelKey: "admin.cmd_change_language",
    fallback: "Change Language",
    icon: Globe,
    group: "actions",
    action: () => {},
  },
  // Projects
  {
    id: "project-real-estate",
    labelKey: "admin.cmd_project_real_estate",
    fallback: "Real Estate Platform",
    icon: FolderOpen,
    group: "projects",
    action: () => {},
  },
  {
    id: "project-car-rental",
    labelKey: "admin.cmd_project_car_rental",
    fallback: "Car Rental Platform",
    icon: FolderOpen,
    group: "projects",
    action: () => {},
  },
  {
    id: "project-ecommerce",
    labelKey: "admin.cmd_project_ecommerce",
    fallback: "E-Commerce Platform",
    icon: FolderOpen,
    group: "projects",
    action: () => {},
  },
]

/* ─── Component ───────────────────────────────────────────────────────────── */

export function SearchCommand({ open, onOpenChange, onNavigate }: SearchCommandProps) {
  const { t } = useI18n()

  const handleSelect = useCallback(
    (id: string) => {
      const item = COMMAND_ITEMS.find((c) => c.id === id)
      if (item) {
        item.action(onNavigate)
      }
      onOpenChange(false)
    },
    [onNavigate, onOpenChange]
  )

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  const pages = COMMAND_ITEMS.filter((i) => i.group === "pages")
  const actions = COMMAND_ITEMS.filter((i) => i.group === "actions")
  const projects = COMMAND_ITEMS.filter((i) => i.group === "projects")

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder={t("admin.search_placeholder") || "Search pages, actions, projects..."}
      />
      <CommandList>
        <CommandEmpty>
          {t("admin.no_results") || "No results found."}
        </CommandEmpty>

        {/* Pages Group */}
        <CommandGroup
          heading={t("admin.search_pages") || "Pages"}
        >
          {pages.map((item) => (
            <CommandItem
              key={item.id}
              onSelect={() => handleSelect(item.id)}
              className="gap-3 py-2.5 cursor-pointer"
            >
              <item.icon className="h-4 w-4 text-[oklch(0.76_0.19_48)] shrink-0" />
              <span className="flex-1">{t(item.labelKey) || item.fallback}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Actions Group */}
        <CommandGroup
          heading={t("admin.search_actions") || "Actions"}
        >
          {actions.map((item) => (
            <CommandItem
              key={item.id}
              onSelect={() => handleSelect(item.id)}
              className="gap-3 py-2.5 cursor-pointer"
            >
              <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="flex-1">{t(item.labelKey) || item.fallback}</span>
              <span className="text-[10px] text-muted-foreground/50 bg-muted/50 px-1.5 py-0.5 rounded">
                {t("admin.action") || "Action"}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Projects Group */}
        <CommandGroup
          heading={t("admin.search_projects") || "Projects"}
        >
          {projects.map((item) => (
            <CommandItem
              key={item.id}
              onSelect={() => handleSelect(item.id)}
              className="gap-3 py-2.5 cursor-pointer"
            >
              <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="flex-1">{t(item.labelKey) || item.fallback}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
