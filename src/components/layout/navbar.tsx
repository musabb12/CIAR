"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, ChevronDown, Globe, LogIn, LogOut, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useI18n, ALL_LOCALES, LOCALE_NAMES } from "@/lib/i18n-context"
import { useRouter, type PageRoute } from "@/lib/router-context"
import { useAuth } from "@/lib/auth-context"
import { useCurrency, CURRENCIES } from "@/lib/currency-context"
import { ThemeSwitcher } from "@/components/layout/theme-switcher"
import { cn } from "@/lib/utils"
import type { HomeBannersConfig } from "@/lib/home-banners"
import type { NewsTickerStyle } from "@/lib/news-ticker"
import { DEFAULT_NEWS_TICKER_STYLE } from "@/lib/news-ticker"
import { NewsTickerStrip } from "@/components/home/NewsTickerStrip"

const NAV_ITEMS: { key: string; route: PageRoute }[] = [
  { key: "nav.home", route: { page: "home" } },
  { key: "nav.projects", route: { page: "projects" } },
  { key: "nav.ads", route: { page: "ads" } },
  { key: "nav.about", route: { page: "about" } },
  { key: "nav.fitting_room", route: { page: "fitting-room" } },
  { key: "nav.contact", route: { page: "contact" } },
]

const DEFAULT_NEWS_TICKER_ITEMS = [
  "منصة CIAR توفر خدمات سياحة وعقارات وتجارة إلكترونية للأفراد والشركات",
  "دعم فني على مدار الساعة لجميع منصاتنا الرقمية",
  "وحدات ذكاء اصطناعي جديدة ضمن منظومتنا المتكاملة",
  "توسع دولي في عدة قطاعات وخدمات رقمية",
]

type NavbarProps = {
  homeConfig?: HomeBannersConfig
  newsTickerItems?: string[]
  newsTickerStyle?: NewsTickerStyle
  /** Home: show strip immediately under the nav links row (inside the fixed header) */
  showNewsTickerStrip?: boolean
}

export function Navbar({
  homeConfig,
  newsTickerItems = [],
  newsTickerStyle = DEFAULT_NEWS_TICKER_STYLE,
  showNewsTickerStrip = false,
}: NavbarProps) {
  const { t, locale, setLocale, dir } = useI18n()
  const { route, navigate } = useRouter()
  const { user, logout } = useAuth()
  const { currency, setCurrency } = useCurrency()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const currentCurrency = CURRENCIES.find((c) => c.code === currency.code) || CURRENCIES[0]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const [prevRouteState, setPrevRouteState] = useState(route.page)
  if (prevRouteState !== route.page) {
    setPrevRouteState(route.page)
    if (mobileOpen) queueMicrotask(() => setMobileOpen(false))
  }

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  const currentPage = route.page === "project" ? "projects" : route.page

  const overDarkHero = !scrolled && currentPage === "projects"

  const navLinkClass = (isActive: boolean) =>
    cn(
      "relative px-4 py-2 text-sm font-semibold transition-colors duration-300",
      overDarkHero
        ? isActive
          ? "text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]"
          : "text-white/90 hover:text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)]"
        : isActive
          ? "text-foreground"
          : "text-foreground/75 hover:text-foreground"
    )

  const utilityBtnClass = cn(
    "text-xs font-medium h-9",
    overDarkHero
      ? "text-white/90 hover:text-white hover:bg-white/10 hover:ring-white/25"
      : "text-foreground/80 hover:text-foreground hover:ring-[oklch(0.78_0.14_82/20%)]"
  )

  const tickerItems = useMemo(
    () => (newsTickerItems.length > 0 ? newsTickerItems : DEFAULT_NEWS_TICKER_ITEMS),
    [newsTickerItems]
  )

  const tickerStripHeight = `${newsTickerStyle.stripHeight}px`

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--news-ticker-visible-height",
      showNewsTickerStrip && newsTickerStyle.enabled ? tickerStripHeight : "0px"
    )
    return () => {
      document.documentElement.style.setProperty("--news-ticker-visible-height", "0px")
    }
  }, [showNewsTickerStrip, newsTickerStyle.enabled, tickerStripHeight])

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500 ease-out",
        scrolled
          ? "glass-strong border-b border-[oklch(0.78_0.14_82/15%)] shadow-lg shadow-black/10"
          : "bg-transparent",
        overDarkHero && "nav-over-hero"
      )}
    >
      {!scrolled && (
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.78_0.14_82/30%)] to-transparent" />
      )}

      <nav
        dir={dir}
        className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 lg:px-8 h-[var(--navbar-height)] min-h-[var(--navbar-height)]"
      >
        <button
          onClick={() => navigate({ page: "home" })}
          className={cn(
            "brand-logo-text transition-opacity duration-300",
            overDarkHero && "brand-logo-text-on-hero"
          )}
          aria-label="CIAR"
        >
          CIAR
        </button>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.route.page
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.route)}
                className={navLinkClass(isActive)}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full"
                    style={{ background: "linear-gradient(90deg, oklch(0.82 0.145 85), oklch(0.78 0.14 82), oklch(0.70 0.13 72))" }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{t(item.key)}</span>
              </button>
            )
          })}
        </div>

        {/* Right side utilities */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ page: "advertise" })}
            className={cn("gap-1.5 px-2.5 hidden sm:inline-flex", utilityBtnClass)}
          >
            <Megaphone className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-medium">{t("nav.advertise") || (locale === "ar" ? "أعلن معنا" : "Advertise")}</span>
          </Button>

          {/* Currency dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn("gap-1 px-2", utilityBtnClass)}
              >
                <span className="text-sm">{currentCurrency.flag}</span>
                <span className="hidden sm:inline text-[11px] font-mono">{currency.code}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {CURRENCIES.map((c) => (
                <DropdownMenuItem
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className={cn(
                    "cursor-pointer text-sm gap-2.5",
                    currency.code === c.code ? "bg-secondary text-foreground font-medium" : ""
                  )}
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="flex-1">{c.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Language dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn("gap-1.5 px-2 hidden sm:flex", utilityBtnClass)}
              >
                <Globe className="h-3.5 w-3.5" />
                <span className="uppercase text-[11px]">{locale}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {ALL_LOCALES.map((loc) => (
                <DropdownMenuItem
                  key={loc}
                  onClick={() => setLocale(loc)}
                  className={cn(
                    "cursor-pointer text-sm",
                    locale === loc ? "bg-primary/10 text-primary font-medium" : ""
                  )}
                >
                  <span className="font-mono text-xs uppercase w-7">{loc}</span>
                  <span className="ms-2">{LOCALE_NAMES[loc]}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile language dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("sm:hidden h-9 w-9", utilityBtnClass)}
                aria-label="Change language"
              >
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 sm:hidden">
              {ALL_LOCALES.map((loc) => (
                <DropdownMenuItem
                  key={loc}
                  onClick={() => setLocale(loc)}
                  className={cn(
                    "cursor-pointer text-sm",
                    locale === loc ? "bg-primary/10 text-primary font-medium" : ""
                  )}
                >
                  <span className="font-mono text-xs uppercase w-7">{loc}</span>
                  <span className="ms-2">{LOCALE_NAMES[loc]}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme switcher */}
          <ThemeSwitcher />

          {/* Auth button */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-foreground/10 text-foreground text-xs font-semibold">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 border-b border-border/50 mb-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4 me-2" />
                  {t("auth.logout") || "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ page: "user-auth" })}
              className={cn("gap-1.5 px-3", utilityBtnClass)}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("auth.login") || "Login"}</span>
            </Button>
          )}

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className={cn("md:hidden h-9 w-9", utilityBtnClass)}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              {mobileOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Menu className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </nav>

      {showNewsTickerStrip && newsTickerStyle.enabled ? (
        <NewsTickerStrip
          items={tickerItems}
          style={newsTickerStyle}
          locale={locale === "ar" ? "ar" : "en"}
          dir={dir}
          className="relative z-40 w-full"
        />
      ) : null}

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 top-[var(--site-header-offset)] bg-background/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              dir={dir}
              initial={{ opacity: 0, x: dir === "rtl" ? -24 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir === "rtl" ? -18 : 18 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "md:hidden fixed bottom-0 top-[var(--site-header-offset)] z-50 w-[88%] max-w-sm glass-strong border-[oklch(0.78_0.14_82/24%)] overflow-hidden",
                "border-s border-y shadow-2xl shadow-black/30",
                dir === "rtl" ? "left-0 rounded-e-2xl" : "right-0 rounded-s-2xl"
              )}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.78_0.14_82/10%),transparent_45%)] pointer-events-none" />
              <div className="relative px-4 py-4 h-full overflow-y-auto">
                <div className="mb-4 flex items-center justify-between rounded-2xl border border-[oklch(0.78_0.14_82/18%)] bg-[oklch(0.12_0.03_265/55%)] px-3 py-2.5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Menu</p>
                    <p className="text-sm font-semibold">{locale === "ar" ? "التنقل السريع" : "Quick Navigation"}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileOpen(false)}
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                    aria-label="Close menu"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="rounded-2xl border border-[oklch(0.78_0.14_82/15%)] bg-[oklch(0.12_0.03_265/45%)] p-2 space-y-1.5">
                {NAV_ITEMS.map((item, index) => {
                  const isActive = currentPage === item.route.page
                  return (
                    <motion.button
                      key={item.key}
                      initial={{ opacity: 0, x: dir === "rtl" ? -12 : 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      onClick={() => { navigate(item.route); setMobileOpen(false) }}
                      className={cn(
                        "group flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-300 min-h-12",
                        isActive
                          ? "bg-gradient-to-r from-[oklch(0.78_0.14_82/14%)] to-[oklch(0.72_0.13_75/14%)] text-[oklch(0.82_0.145_85)] border border-[oklch(0.78_0.14_82/30%)]"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground border border-transparent"
                      )}
                    >
                      <span className="relative z-10 tracking-wide">{t(item.key)}</span>
                      <span className={cn(
                        "h-2 w-2 rounded-full transition-all",
                        isActive ? "bg-[oklch(0.78_0.14_82)] shadow-[0_0_10px_oklch(0.78_0.14_82/70%)]" : "bg-transparent group-hover:bg-foreground/30"
                      )} />
                    </motion.button>
                  )
                })}
                </div>

                {/* Mobile utilities */}
                <div className="pt-4 mt-4 border-t border-border/20 space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { navigate({ page: "advertise" }); setMobileOpen(false) }}
                    className="w-full text-sm h-10 gap-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary/5"
                  >
                    <Megaphone className="h-3.5 w-3.5" />
                    {t("nav.advertise") || (locale === "ar" ? "أعلن معنا" : "Advertise with us")}
                  </Button>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 px-2.5 py-1">
                      <span>{currentCurrency.flag}</span>
                      <span className="font-mono">{currency.code}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 px-2.5 py-1 uppercase">
                      <Globe className="h-3.5 w-3.5" />
                      {locale}
                    </span>
                  </div>
                  {user ? (
                    <Button variant="ghost" size="sm" onClick={() => { logout(); setMobileOpen(false) }} className="w-full text-destructive text-sm h-10 gap-1.5 rounded-xl border border-destructive/20 hover:bg-destructive/10">
                      <LogOut className="h-3.5 w-3.5" />
                      {t("auth.logout") || "Logout"}
                    </Button>
                  ) : (
                    <Button variant="default" size="sm" onClick={() => { navigate({ page: "user-auth" }); setMobileOpen(false) }} className="w-full text-sm h-10 gap-1.5 rounded-xl btn-gold">
                      <LogIn className="h-3.5 w-3.5" />
                      {t("auth.login") || "Login"}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
