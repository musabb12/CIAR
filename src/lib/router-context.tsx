"use client"

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"

export type PageRoute =
  | { page: "home" }
  | { page: "projects" }
  | { page: "project"; slug: string }
  | { page: "platform"; slug: string }
  | { page: "about" }
  | { page: "fitting-room" }
  | { page: "contact" }
  | { page: "advertise" }
  | { page: "ads" }
  | { page: "privacy" }
  | { page: "terms" }
  | { page: "user-auth" }
  | { page: "subscription" }
  | { page: "subscription-payment" }
  | { page: "admin-login" }
  | { page: "admin"; tab?: string }

interface RouterContextType {
  route: PageRoute
  navigate: (route: PageRoute) => void
  back: () => void
}

const RouterContext = createContext<RouterContextType>({
  route: { page: "home" },
  navigate: () => {},
  back: () => {},
})

function parseLocationToRoute(): PageRoute {
  if (typeof window === "undefined") return { page: "home" }

  const path = window.location.pathname
  if (path.startsWith("/admin/panel")) {
    const seg = path.replace("/admin/panel/", "").split("/").filter(Boolean)[0] || "overview"
    return { page: "admin", tab: seg }
  }

  const hash = window.location.hash.slice(1)
  if (!hash || hash === "/") return { page: "home" }
  if (hash === "/projects") return { page: "projects" }
  if (hash.startsWith("/project/")) return { page: "project", slug: hash.slice(9) }
  if (hash.startsWith("/platform/")) return { page: "platform", slug: hash.slice(10) }
  if (hash === "/about") return { page: "about" }
  if (hash === "/fitting-room") return { page: "fitting-room" }
  if (hash === "/contact") return { page: "contact" }
  if (hash === "/advertise") return { page: "advertise" }
  if (hash === "/ads") return { page: "ads" }
  if (hash === "/privacy") return { page: "privacy" }
  if (hash === "/terms") return { page: "terms" }
  if (hash === "/login") return { page: "user-auth" }
  if (hash === "/subscription") return { page: "subscription" }
  if (hash === "/subscription/payment") return { page: "subscription-payment" }
  if (hash === "/admin-login") return { page: "admin-login" }
  if (hash.startsWith("/admin")) {
    const parts = hash.split("/")
    return { page: "admin", tab: parts[2] || "overview" }
  }
  return { page: "home" }
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState<PageRoute>({ page: "home" })
  const historyRef = useRef<PageRoute[]>([{ page: "home" }])

  const navigate = useCallback((newRoute: PageRoute) => {
    historyRef.current.push(newRoute)
    setRoute(newRoute)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const back = useCallback(() => {
    if (historyRef.current.length > 1) {
      historyRef.current.pop()
      const prev = historyRef.current[historyRef.current.length - 1]
      setRoute(prev)
    } else {
      setRoute({ page: "home" })
    }
  }, [])

  useEffect(() => {
    const initialRoute = parseLocationToRoute()
    historyRef.current = [initialRoute]

    const syncRoute = (r: PageRoute) => {
      setRoute(r)
    }

    syncRoute(initialRoute)

    const onHashChange = () => {
      const r = parseLocationToRoute()
      historyRef.current.push(r)
      syncRoute(r)
    }

    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.location.pathname.startsWith("/admin/panel")) {
      return
    }

    let hash = "/"
    switch (route.page) {
      case "home":
        hash = "/"
        break
      case "projects":
        hash = "/projects"
        break
      case "project":
        hash = `/project/${route.slug}`
        break
      case "platform":
        hash = `/platform/${route.slug}`
        break
      case "about":
        hash = "/about"
        break
      case "fitting-room":
        hash = "/fitting-room"
        break
      case "contact":
        hash = "/contact"
        break
      case "advertise":
        hash = "/advertise"
        break
      case "ads":
        hash = "/ads"
        break
      case "privacy":
        hash = "/privacy"
        break
      case "terms":
        hash = "/terms"
        break
      case "user-auth":
        hash = "/login"
        break
      case "subscription":
        hash = "/subscription"
        break
      case "subscription-payment":
        hash = "/subscription/payment"
        break
      case "admin-login":
        hash = "/admin-login"
        break
      case "admin":
        hash = `/admin/${route.tab || "overview"}`
        break
    }
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", `#${hash}`)
    }
  }, [route])

  return (
    <RouterContext.Provider value={{ route, navigate, back }}>
      {children}
    </RouterContext.Provider>
  )
}

export function useRouter() {
  return useContext(RouterContext)
}
