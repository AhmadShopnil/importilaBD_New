"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Menu,
  X,
  BarChart3,
  Package,
  Tag,
  ShoppingCart,
  TrendingUp,
  ChevronsLeft,
  LayoutList,
  Settings,
  ChevronDown,
  LogOut,
  GalleryVertical,
  MessageSquare,
  Image as ImageIcon,
  Users,
} from "lucide-react"
import Image from "next/image"
import toast from "react-hot-toast"

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: BarChart3 },
  { label: "Products", href: "/admin/products", icon: LayoutList },
  { label: "Combos", href: "/admin/combos", icon: Package },
  {
    label: "Orders",
    icon: ShoppingCart,
    children: [
      { label: "Regular Orders", href: "/admin/orders/regular" },
      { label: "Combo Orders", href: "/admin/orders/combos" },
      { label: "Manual Entry", href: "/admin/orders/new" },
    ],
  },
  { label: "Media Library", href: "/admin/media", icon: ImageIcon },
  { label: "Categories", href: "/admin/categories", icon: Tag },
  { label: "Sliders", href: "/admin/sliders", icon: GalleryVertical },
  { label: "Stock", href: "/admin/stock", icon: TrendingUp },
  {
    label: "Reports",
    icon: BarChart3,
    children: [
      { label: "Sales Report", href: "/admin/reports" },
      { label: "Best Selling", href: "/admin/reports/best-selling" },
      { label: "Channel Analysis", href: "/admin/reports/sources" },
      { label: "Courier Report", href: "/admin/reports/courier" },
    ],
  },
  { label: "Reviews", href: "/admin/reviews", icon: MessageSquare },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Users", href: "/admin/users", icon: Users, role: "super_admin" },
]

export default function AdminSidebarClientResposive({ role, initialSettings = null }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openMenus, setOpenMenus] = useState({})
  const [settings, setSettings] = useState(initialSettings)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!settings) {
      fetch("/api/settings", { credentials: "include" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setSettings(data)
        })
        .catch((err) => console.error("Failed to fetch settings in sidebar:", err))
    }
  }, [settings])

  const dashboardName = settings?.dashboardName || "Admin Panel"
  const dashboardLogo = settings?.dashboardLogo || settings?.storeLogo || "/logo.svg"
  const displayMode = settings?.dashboardDisplayMode || "logo_only"

  // Prevent background scroll on mobile
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : ""
  }, [mobileMenuOpen])

  const toggleMenu = (label) =>
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }))

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/admin/login", { method: "DELETE" })
      if (res.ok) {
        toast.success("Logged out")
        router.push("/admin/login")
        router.refresh()
      }
    } catch {
      toast.error("Logout failed")
    }
  }

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="sticky top-0 z-40 lg:hidden bg-card border-b border-border px-4 py-3 flex justify-between items-center h-16">
        <Link href="/admin" className="flex items-center gap-2 max-w-[220px]">
          {(displayMode === "logo_only" || displayMode === "both") && dashboardLogo && (
            <img
              src={dashboardLogo}
              alt={dashboardName}
              className="h-8 max-w-[120px] object-contain"
            />
          )}
          {(displayMode === "name_only" || displayMode === "both" || !dashboardLogo) && (
            <span className="text-base font-bold text-primary truncate">
              {dashboardName}
            </span>
          )}
        </Link>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 hover:bg-muted rounded"
        >
          <Menu />
        </button>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-card border-r border-border
          transition-all duration-300 ease-in-out
          flex flex-col
          ${mobileMenuOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full w-64"}
          lg:translate-x-0 lg:static lg:shadow-none
          ${sidebarOpen ? "lg:w-64" : "lg:w-20"}
        `}
      >
        {/* LOGO & BRAND */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 min-h-16">
          {(sidebarOpen || mobileMenuOpen) ? (
            <Link href="/admin" className="flex items-center gap-2 overflow-hidden mr-2">
              {(displayMode === "logo_only" || displayMode === "both") && dashboardLogo && (
                <img
                  src={dashboardLogo}
                  alt={dashboardName}
                  className="h-8 max-w-[130px] object-contain shrink-0"
                />
              )}
              {(displayMode === "name_only" || displayMode === "both" || !dashboardLogo) && (
                <span className="text-sm font-bold text-primary truncate tracking-tight">
                  {dashboardName}
                </span>
              )}
            </Link>
          ) : (
            <div className="w-8 h-8 flex items-center justify-center mx-auto">
              {dashboardLogo ? (
                <img
                  src={dashboardLogo}
                  alt={dashboardName}
                  className="w-7 h-7 object-contain"
                />
              ) : (
                <span className="font-bold text-primary text-xs">
                  {dashboardName ? dashboardName.charAt(0) : "A"}
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-muted rounded hidden lg:block shrink-0"
            aria-label="Toggle sidebar"
          >
            <ChevronsLeft
              className={`transition ${sidebarOpen ? "" : "rotate-180"}`}
            />
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 hover:bg-muted rounded lg:hidden shrink-0"
            aria-label="Close menu"
          >
            <X />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {adminNavItems.filter(item => !item.role || item.role === role).map((item) => {
            const Icon = item.icon
            const isParentActive = item.children?.some(
              (c) => pathname === c.href
            )

            if (item.children) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`flex items-center justify-between w-full px-4 py-2 rounded-lg
                    ${isParentActive
                        ? "bg-[#1E556E] text-white"
                        : "text-[#1E556E] hover:bg-muted"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      {(sidebarOpen || mobileMenuOpen) && (
                        <span>{item.label}</span>
                      )}
                    </div>

                    {(sidebarOpen || mobileMenuOpen) && (
                      <ChevronDown
                        className={`w-4 h-4 transition ${openMenus[item.label] ? "rotate-180" : ""
                          }`}
                      />
                    )}
                  </button>

                  {openMenus[item.label] &&
                    (sidebarOpen || mobileMenuOpen) && (
                      <div className="ml-9 mt-2 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-3 py-2 rounded-md text-sm
                            ${pathname === child.href
                                ? "bg-muted font-semibold"
                                : "hover:bg-muted"
                              }`}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                </div>
              )
            }

            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg
                ${isActive
                    ? "bg-[#1E556E] text-white"
                    : "text-[#1E556E] hover:bg-muted"
                  }`}
              >
                <Icon className="w-5 h-5" />
                {(sidebarOpen || mobileMenuOpen) && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* FOOTER */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full bg-destructive text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90"
          >
            <LogOut size={18} />
            {(sidebarOpen || mobileMenuOpen) && "Logout"}
          </button>
        </div>
      </aside>

      {/* OVERLAY */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
        />
      )}
    </>
  )
}
