import Link from "next/link";
import Container from "@/components/Container";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";

const DEFAULT_FOOTER_LINKS = [
  { label: "Shop", url: "/shop" },
  { label: "Combos", url: "/combo" },
  { label: "Terms & Conditions", url: "/terms-and-conditions" },
];

const Footer = ({ menus = [], settings = {} }) => {
  const storeName = settings?.storeName || "Importila";
  const footerDescription =
    settings?.footerDescription?.trim() ||
    "Quality kids clothing crafted for comfort, style, and everyday joy.";
  const copyrightText =
    settings?.copyrightText?.trim() ||
    `© ${new Date().getFullYear()} ${storeName}. All rights reserved.`;

  const fullAddress = [settings?.storeAddress, settings?.storeCity]
    .filter(Boolean)
    .join(", ");

  let footerLinks = DEFAULT_FOOTER_LINKS;

  if (Array.isArray(menus) && menus.length > 0) {
    const footerMenu =
      menus.find((m) => m.location === "footer" && m.isActive !== false) ||
      menus.find((m) => m.slug === "footer-menu" && m.isActive !== false);

    if (footerMenu && Array.isArray(footerMenu.items) && footerMenu.items.length > 0) {
      footerLinks = footerMenu.items;
    } else if (menus[0]?.url) {
      // Legacy flat items fallback
      footerLinks = menus.filter((m) => m.isActive !== false && m.location !== "header");
    }
  }

  const linksToDisplay = footerLinks.length > 0 ? footerLinks : DEFAULT_FOOTER_LINKS;

  const waDigits = (settings?.whatsappNumber || "").replace(/\D/g, "");
  const waPhone =
    waDigits.length === 11 && waDigits.startsWith("01")
      ? `88${waDigits}`
      : waDigits;

  return (
    <footer className="bg-[#1C546D] text-white/90 border-t border-white/10">
      <Container className="py-10 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-white/15">
          {/* Brand & About */}
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {storeName}
            </h3>
            <p className="text-sm text-white/80 leading-relaxed max-w-sm">
              {footerDescription}
            </p>
            {settings?.facebookUrl?.trim() && (
              <div className="pt-1">
                <a
                  href={settings.facebookUrl.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                  <span>Facebook Page</span>
                </a>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-base font-semibold text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm text-white/80">
              {linksToDisplay.map((link, idx) => (
                <li key={link.id || link._id || idx}>
                  <Link
                    href={link.url || "/"}
                    target={link.openInNewTab ? "_blank" : undefined}
                    rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="text-base font-semibold text-white">Contact Us</h4>
            <ul className="space-y-2.5 text-sm text-white/80">
              {settings?.storePhone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-white/70 shrink-0" />
                  <a href={`tel:${settings.storePhone}`} className="hover:text-white transition-colors">
                    {settings.storePhone}
                  </a>
                </li>
              )}
              {waPhone && (
                <li className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                  <a
                    href={`https://wa.me/${waPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    WhatsApp: {settings.whatsappNumber}
                  </a>
                </li>
              )}
              {settings?.storeEmail && (
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-white/70 shrink-0" />
                  <a href={`mailto:${settings.storeEmail}`} className="hover:text-white transition-colors">
                    {settings.storeEmail}
                  </a>
                </li>
              )}
              {fullAddress && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-white/70 shrink-0 mt-0.5" />
                  <span>{fullAddress}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-white/75">
          <p>{copyrightText}</p>
          <p className="text-xs text-white/60">Cash on Delivery Available Nationwide</p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
