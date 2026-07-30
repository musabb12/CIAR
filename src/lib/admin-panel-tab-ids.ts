/**
 * تبويبات لوحة التحكم — الشريط الجانبي + تبويبات الأقسام (عبر مركز الصفحة).
 */
import { getSectionAdminTabIds } from "@/lib/section-admin-registry"

export const ADMIN_PANEL_TAB_IDS = [
  "overview",
  "analytics",
  "activity",
  "projects",
  "media",
  "backgrounds",
  "home-banners",
  "image-strip",
  "about-content",
  "legal-pages",
  "contacts",
  "ads",
  "fitting-room",
  "subscriptions",
  "campaigns",
  "users",
  "news-ticker",
  "ai",
  "seo",
  "appearance",
  "settings",
  "data-export",
  ...getSectionAdminTabIds(),
] as const

export type AdminPanelTabId = (typeof ADMIN_PANEL_TAB_IDS)[number]

export function isAdminPanelTabId(tab: string): tab is AdminPanelTabId {
  return (ADMIN_PANEL_TAB_IDS as readonly string[]).includes(tab)
}
