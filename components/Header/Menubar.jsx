"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Search, Menu, X, ChevronDown, ExternalLink } from "lucide-react";
import Container from "@/components/Container";
import { useCart } from "@/context/CartContext";

const DEFAULT_LINKS = [
  { label: "Home", url: "/" },
  { label: "Shop", url: "/shop" },
  { label: "Combos", url: "/combo", badge: "Hot" },
];

const Menubar = ({ menus = [], settings = {} }) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const cart = useCart();
  const cartCount = cart?.cartCount || 0;
  const setIsCartOpen = cart?.setIsCartOpen || (() => {});

  const storeName = settings?.storeName || "Importila";
  const storeLogo = settings?.storeLogo || "/logo.svg";
  const storeDisplayMode = settings?.storeDisplayMode || "logo_only";

  // Extract items for Header Navigation
  let headerItems = DEFAULT_LINKS;
  if (Array.isArray(menus) && menus.length > 0) {
    // 1. Check if multi-menu format (menus array with `items`)
    const headerMenu =
      menus.find((m) => m.location === "header" && m.isActive !== false) ||
      menus.find((m) => m.slug === "main-menu" && m.isActive !== false) ||
      (menus[0]?.items ? menus[0] : null);

    if (headerMenu && Array.isArray(headerMenu.items) && headerMenu.items.length > 0) {
      headerItems = headerMenu.items;
    } else if (menus[0]?.url) {
      // Legacy flat items fallback
      headerItems = menus.filter((m) => m.isActive !== false && m.location !== "footer");
    }
  }

  const displayLinks = headerItems.length > 0 ? headerItems : DEFAULT_LINKS;

  const checkIsActive = (href) => {
    if (!href) return false;
    if (pathname === href) return true;
    if (href.startsWith("/category/") && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-200">
      <Container className="flex items-center justify-between h-16 px-4">
        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-md text-gray-700 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Brand: Logo, Name, or Both */}
        <Link href="/" className="flex items-center gap-2.5">
          {(storeDisplayMode === "logo_only" || storeDisplayMode === "both" || !storeDisplayMode) && storeLogo && (
            <img
              src={storeLogo}
              alt={storeName}
              className="h-8 sm:h-9 w-auto max-w-[120px] sm:max-w-[150px] object-contain"
            />
          )}
          {(storeDisplayMode === "name_only" || storeDisplayMode === "both" || !storeLogo) && (
            <span className="text-lg sm:text-xl font-bold tracking-tight text-[#1C546D]">
              {storeName}
            </span>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-7">
          {displayLinks.map((item, idx) => {
            const href = item.url || item.href || "/";
            const label = item.label || item.name;
            const isActive = checkIsActive(href);
            const hasChildren = Array.isArray(item.children) && item.children.length > 0;

            if (hasChildren) {
              return (
                <div
                  key={item.id || item._id || idx}
                  className="relative group py-2"
                  onMouseEnter={() => setOpenDropdown(item.id || item._id || idx)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <Link
                    href={href}
                    target={item.openInNewTab ? "_blank" : undefined}
                    rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                    className={`text-sm font-medium transition-colors py-1 inline-flex items-center gap-1 relative ${
                      isActive
                        ? "text-[#1C546D] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#1C546D]"
                        : "text-gray-600 hover:text-[#1C546D]"
                    }`}
                  >
                    <span>{label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[9px] font-extrabold rounded">
                        {item.badge}
                      </span>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:rotate-180 transition-transform" />
                  </Link>

                  {/* Dropdown Menu */}
                  <div className="absolute top-full left-0 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                    {item.children.map((child, cIdx) => (
                      <Link
                        key={cIdx}
                        href={child.url}
                        target={child.openInNewTab ? "_blank" : undefined}
                        rel={child.openInNewTab ? "noopener noreferrer" : undefined}
                        className="block px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-[#1C546D] transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.id || item._id || idx}
                href={href}
                target={item.openInNewTab ? "_blank" : undefined}
                rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                className={`text-sm font-medium transition-colors py-1 inline-flex items-center gap-1.5 relative ${
                  isActive
                    ? "text-[#1C546D] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#1C546D]"
                    : "text-gray-600 hover:text-[#1C546D]"
                }`}
              >
                <span>{label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[9px] font-extrabold rounded">
                    {item.badge}
                  </span>
                )}
                {item.openInNewTab && <ExternalLink className="w-3 h-3 text-gray-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/shop"
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Link>

          <button
            onClick={() => setIsCartOpen(true)}
            aria-label="Shopping Cart"
            className="relative p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-[#1C546D] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-semibold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </Container>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white shadow-md">
          <Container className="py-3 space-y-1 px-4">
            {displayLinks.map((item, idx) => {
              const href = item.url || item.href || "/";
              const label = item.label || item.name;
              const isActive = checkIsActive(href);
              const hasChildren = Array.isArray(item.children) && item.children.length > 0;

              return (
                <div key={item.id || item._id || idx} className="space-y-1">
                  <Link
                    href={href}
                    target={item.openInNewTab ? "_blank" : undefined}
                    rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-gray-100 text-[#1C546D] font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[9px] font-extrabold rounded">
                          {item.badge}
                        </span>
                      )}
                    </span>
                    {hasChildren && <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                  </Link>

                  {/* Mobile Submenu links */}
                  {hasChildren && (
                    <div className="pl-4 space-y-1 border-l-2 border-gray-200 ml-3">
                      {item.children.map((child, cIdx) => (
                        <Link
                          key={cIdx}
                          href={child.url}
                          target={child.openInNewTab ? "_blank" : undefined}
                          rel={child.openInNewTab ? "noopener noreferrer" : undefined}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-3 py-1.5 text-xs text-gray-600 hover:text-[#1C546D]"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </Container>
        </div>
      )}
    </header>
  );
};

export default Menubar;
