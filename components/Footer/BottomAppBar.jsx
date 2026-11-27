"use client";

import Link from "next/link";
import { Home, Package, ShoppingBag, ShoppingCart } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";

const BottomAppBar = () => {
  const pathname = usePathname();
  const cart = useCart();
  const cartCount = cart?.cartCount || 0;
  const setIsCartOpen = cart?.setIsCartOpen || (() => {});

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden shadow-lg py-1 px-2">
      <div className="grid grid-cols-4 items-center">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1.5 gap-0.5 text-xs transition-colors ${
            pathname === "/" ? "text-[#1C546D] font-semibold" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[11px]">Home</span>
        </Link>

        <Link
          href="/shop"
          className={`flex flex-col items-center justify-center py-1.5 gap-0.5 text-xs transition-colors ${
            pathname === "/shop" ? "text-[#1C546D] font-semibold" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[11px]">Shop</span>
        </Link>

        <Link
          href="/combo"
          className={`flex flex-col items-center justify-center py-1.5 gap-0.5 text-xs transition-colors ${
            pathname?.startsWith("/combo") ? "text-[#1C546D] font-semibold" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[11px]">Combos</span>
        </Link>

        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center py-1.5 gap-0.5 text-xs text-gray-500 hover:text-[#1C546D] cursor-pointer"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#1C546D] text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[11px]">Cart</span>
        </button>
      </div>
    </div>
  );
};

export default BottomAppBar;
