import Link from "next/link";
import Container from "@/components/Container";

const DEFAULT_FOOTER_LINKS = [
  { label: "Shop", url: "/shop" },
  { label: "Combos", url: "/combo" },
  { label: "Terms & Conditions", url: "/terms-and-conditions" },
];

const Footer = ({ menus = [], settings = {} }) => {
  const storeName = settings?.storeName || "Importila";
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

  return (
    <footer className="bg-[#1C546D] text-white/90 border-t border-gray-200">
      <Container className="py-6 px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
          <div className="flex items-center gap-6 text-white/80 flex-wrap">
            {linksToDisplay.map((link, idx) => (
              <Link
                key={link.id || link._id || idx}
                href={link.url || "/"}
                target={link.openInNewTab ? "_blank" : undefined}
                rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                className="hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
