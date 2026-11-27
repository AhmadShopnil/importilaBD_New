
import { ProductSelectionProvider } from "@/context/ProductSelectionContext"
import Menubar from "@/components/Header/Menubar"
import BottomAppBar from "@/components/Footer/BottomAppBar"
import Footer from "@/components/Footer/Footer"
import { CartProvider } from "@/context/CartContext"
import CartDrawer from "@/components/Cart/CartDrawer"
import { GoogleTagManager } from '@next/third-parties/google'
import { getStoreSettings, getStoreMenus } from "@/lib/dataService"
import PageViewTracker from "@/components/Tracking/PageViewTracker"
import { Suspense } from 'react'


export const dynamic = "force-dynamic"

export const metadata = {
  title: "Importila",
  description: "Shop for quality kids clothing with fun designs",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default async function RootLayout({ children }) {
  const [settings, menus] = await Promise.all([getStoreSettings(), getStoreMenus()])
  const gtmId = settings?.googleTagManagerId || settings?.gtmId

  return (
    <>
      <CartProvider>
        <ProductSelectionProvider>
          {settings?.enableGTM && gtmId && (
            <GoogleTagManager gtmId={gtmId} />
          )}
          <Suspense fallback={null}>
            <PageViewTracker />
          </Suspense>
          <Menubar menus={menus} settings={settings} />
          {children}
          <BottomAppBar />
          <Footer menus={menus} settings={settings} />
          <CartDrawer />
        </ProductSelectionProvider>
      </CartProvider>
    </>
  )
}
