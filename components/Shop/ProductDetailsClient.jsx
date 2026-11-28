"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  Zap,
  Check,
  Minus,
  Plus,
  Ruler,
  ChevronRight,
} from "lucide-react";
import Container from "@/components/Container";
import { useCart } from "@/context/CartContext";
import CheckoutModal from "@/components/Cart/CheckoutModal";
import { trackViewItem } from "@/utils/gtm";
import { ProductCard } from "@/components/Home/ProductList/ProductList";

const ProductDetailsClient = ({ product, relatedProducts = [], whatsappNumber = "" }) => {
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(
    product.featuredImage || "/placeholder.svg"
  );
  const [quantity, setQuantity] = useState(1);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    if (product) {
      trackViewItem(product);
    }
  }, [product]);

  // Derived State for Variants
  const allVariants = product.variants || [];

  // 1. Get Unique Sizes
  const uniqueSizes = useMemo(() => {
    const sizes = allVariants.map((v) => v.size).filter(Boolean);
    return [...new Set(sizes)];
  }, [allVariants]);

  const searchParams = useSearchParams();
  const colorFromQuery = searchParams.get("color");

  const [selectedSize, setSelectedSize] = useState(() => {
    if (colorFromQuery) {
      const variantWithColor = allVariants.find(
        (v) => v.colorName === colorFromQuery
      );
      if (variantWithColor) return variantWithColor.size;
    }
    return uniqueSizes[0] || null;
  });

  // 2. Get Available Colors for Selected Size
  const availableColorsForSize = useMemo(() => {
    if (!selectedSize) return [];
    return allVariants.filter(
      (v) => String(v.size || "").trim().toLowerCase() === String(selectedSize || "").trim().toLowerCase()
    );
  }, [allVariants, selectedSize]);

  const [selectedColorName, setSelectedColorName] = useState(
    colorFromQuery || availableColorsForSize[0]?.colorName || null
  );

  // Sync color when size changes
  useEffect(() => {
    if (selectedSize) {
      const colors = allVariants.filter(
        (v) => String(v.size || "").trim().toLowerCase() === String(selectedSize || "").trim().toLowerCase()
      );
      const exists = colors.find(
        (c) => String(c.colorName || "").trim().toLowerCase() === String(selectedColorName || "").trim().toLowerCase()
      );
      if (!exists && colors.length > 0) {
        setSelectedColorName(colors[0].colorName);
      }
    }
  }, [selectedSize, allVariants, selectedColorName]);

  // 3. Final Selected Variant SKU/Object
  const selectedVariant = useMemo(() => {
    if (!selectedSize || !selectedColorName) return null;
    return allVariants.find(
      (v) =>
        String(v.size || "").trim().toLowerCase() === String(selectedSize || "").trim().toLowerCase() &&
        String(v.colorName || "").trim().toLowerCase() === String(selectedColorName || "").trim().toLowerCase()
    );
  }, [allVariants, selectedSize, selectedColorName]);

  const currentStock = useMemo(() => {
    if (allVariants.length === 0) {
      return product.stock !== undefined ? Math.max(0, Number(product.stock)) : 999;
    }
    if (!selectedVariant) return 0;
    return Math.max(0, Number(selectedVariant.stock || 0));
  }, [allVariants, selectedVariant, product.stock]);

  const isOutOfStock = useMemo(() => {
    return currentStock <= 0;
  }, [currentStock]);

  const isSizeOutOfStock = (size) => {
    const variantsForSize = allVariants.filter(
      (v) => String(v.size || "").trim().toLowerCase() === String(size || "").trim().toLowerCase()
    );
    if (variantsForSize.length === 0) return false;
    return variantsForSize.every((v) => Number(v.stock || 0) <= 0);
  };

  const isColorOutOfStock = (colorName) => {
    if (!selectedSize) return false;
    const variant = allVariants.find(
      (v) =>
        String(v.size || "").trim().toLowerCase() === String(selectedSize || "").trim().toLowerCase() &&
        String(v.colorName || "").trim().toLowerCase() === String(colorName || "").trim().toLowerCase()
    );
    if (!variant) return false;
    return Number(variant.stock || 0) <= 0;
  };

  useEffect(() => {
    if (selectedVariant?.image) {
      setSelectedImage(selectedVariant.image);
    }
  }, [selectedVariant]);

  const allImages = useMemo(() => {
    const list = [product.featuredImage, ...(product.images || [])].filter(
      Boolean
    );
    return [...new Set(list)];
  }, [product]);

  const hasDiscount = product.offerPrice > 0 && product.offerPrice < product.price;
  const savings = hasDiscount ? product.price - product.offerPrice : 0;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      alert("This variant is currently out of stock. Please select another size or color.");
      return;
    }
    if (uniqueSizes.length > 0 && (!selectedSize || !selectedVariant)) {
      alert("Please select a size first");
      return;
    }
    addToCart(
      product,
      {
        colorName: selectedVariant?.colorName || "Standard",
        colorHex: selectedVariant?.colorHex || "#ffffff",
        size: selectedVariant?.size || "Standard",
        sku: selectedVariant?.sku || "",
        image: selectedVariant?.image || product.featuredImage,
      },
      quantity
    );
  };

  const handleBuyNow = () => {
    if (isOutOfStock) {
      alert("This variant is currently out of stock. Please select another size or color.");
      return;
    }
    if (uniqueSizes.length > 0 && (!selectedSize || !selectedVariant)) {
      alert("Please select a size and color first");
      return;
    }
    setIsCheckoutModalOpen(true);
  };

  const buyNowItems = useMemo(
    () => [
      {
        ...product,
        selectedColor: selectedVariant?.colorName,
        selectedColorHex: selectedVariant?.colorHex,
        selectedSize: selectedVariant?.size,
        sku: selectedVariant?.sku,
        image: selectedVariant?.image || product.featuredImage || product.image,
        quantity: quantity,
      },
    ],
    [product, selectedVariant, quantity]
  );

  return (
    <div className="py-4 md:py-6 bg-white">
      <Container>
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4 flex-wrap">
          <Link href="/" className="hover:text-gray-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <Link href="/shop" className="hover:text-gray-900 transition-colors">
            Shop
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-medium line-clamp-1">
            {product.name}
          </span>
        </div>

        {/* Product Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-8 border-b border-gray-200 mb-8 items-start">
          {/* Left Column: Media Gallery (5 cols on lg/xl) */}
          <div className="lg:col-span-5 space-y-2.5 max-w-[440px] mx-auto lg:mx-0 w-full">
            <div className="relative aspect-[4/5] max-h-[440px] w-full rounded-md overflow-hidden bg-gray-50 border border-gray-200">
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />

              {hasDiscount && (
                <span className="absolute top-2.5 left-2.5 bg-[#1C546D] text-white text-xs font-semibold px-2.5 py-0.5 rounded-xs">
                  SAVE ৳{savings}
                </span>
              )}
            </div>

            {/* Thumbnail Strip */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-14 h-14 rounded-md overflow-hidden shrink-0 border transition-all cursor-pointer ${
                      selectedImage === img
                        ? "border-[#1C546D] ring-1 ring-[#1C546D]"
                        : "border-gray-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Information & Purchase Actions (7 cols) */}
          <div className="lg:col-span-7 space-y-3.5">
            {/* Product Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 pt-2 pb-3 border-b border-gray-100">
                <span className="text-3xl sm:text-4xl font-bold text-[#1C546D]">
                  ৳{product.offerPrice > 0 ? product.offerPrice : product.price}
                </span>
                {hasDiscount && (
                  <span className="text-base text-gray-400 line-through">
                    ৳{product.price}
                  </span>
                )}
              </div>
            </div>

            {/* Short Description */}
            {product.description && (
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed line-clamp-2">
                {product.description}
              </p>
            )}

            {/* Variant Selector: Sizes */}
            {uniqueSizes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 uppercase">
                    Select Size
                  </span>
                  {product.sizeChart && (
                    <button
                      onClick={() => {
                        setActiveTab("size-chart");
                        document
                          .getElementById("product-tabs")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="text-sm font-medium text-[#1C546D] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Ruler className="w-4 h-4" />
                      <span>Size Guide</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {uniqueSizes.map((size) => {
                    const isSelected = selectedSize === size;
                    const sizeSoldOut = isSizeOutOfStock(size);
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer border flex items-center gap-1 ${
                          isSelected
                            ? "bg-[#1C546D] text-white border-[#1C546D]"
                            : sizeSoldOut
                            ? "bg-gray-100 border-gray-200 text-gray-400"
                            : "bg-white border-gray-200 text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        <span>{size}</span>
                        {sizeSoldOut && (
                          <span className="text-xs text-red-500 font-semibold">(Out)</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Variant Selector: Colors */}
            {availableColorsForSize.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 uppercase">
                    Color
                  </span>
                  {selectedColorName && (
                    <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                      <span>{selectedColorName}</span>
                      {isOutOfStock && (
                        <span className="text-red-600 text-xs font-semibold">(Stock Out)</span>
                      )}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableColorsForSize.map((v) => {
                    const isSelected = selectedColorName === v.colorName;
                    const isSoldOut = Number(v.stock || 0) <= 0;
                    const isLightColor = [
                      "#ffffff",
                      "#fff",
                      "white",
                      "#fff824",
                      "#ffff00",
                    ].includes(v.colorHex?.toLowerCase());

                    return (
                      <button
                        key={v.colorName}
                        onClick={() => setSelectedColorName(v.colorName)}
                        title={`${v.colorName}${isSoldOut ? " (Stock Out)" : ` (${v.stock} in stock)`}`}
                        className={`group relative p-0.5 rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#1C546D] ring-1 ring-[#1C546D]"
                            : isSoldOut
                            ? "border-red-200 opacity-60"
                            : "border-transparent hover:border-gray-300"
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full border border-black/10 flex items-center justify-center relative overflow-hidden"
                          style={{ backgroundColor: v.colorHex }}
                        >
                          {isSelected && !isSoldOut && (
                            <Check
                              className={`w-3 h-3 ${
                                isLightColor ? "text-gray-900" : "text-white"
                              }`}
                            />
                          )}
                          {isSoldOut && (
                            <span className="text-[9px] font-bold text-red-600 bg-white/90 px-0.5 rounded-xs leading-none">✕</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock Status Indicator */}
            {isOutOfStock ? (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                <span>
                  স্টক শেষ (Stock Out): {selectedVariant?.colorName || selectedColorName} ({selectedSize}) এই ভ্যারিয়েন্টটির বর্তমানে কোনো স্টক নেই।
                </span>
              </div>
            ) : currentStock <= 5 ? (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span>Only {currentStock} left in stock - order soon!</span>
              </div>
            ) : null}

            {/* Quantity & Action Buttons Inline */}
            <div className="pt-2 border-t border-gray-100 space-y-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Quantity */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700 uppercase sm:hidden">
                    Qty:
                  </span>
                  <div className={`flex items-center w-fit border border-gray-200 rounded-md bg-white ${isOutOfStock ? "opacity-50 pointer-events-none bg-gray-100" : ""}`}>
                    <button
                      disabled={isOutOfStock || quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-9 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-gray-900">
                      {isOutOfStock ? 0 : quantity}
                    </span>
                    <button
                      disabled={isOutOfStock || quantity >= currentStock}
                      onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                      className="w-9 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex-1 grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className={`w-full py-3 px-3 rounded-md font-medium text-sm sm:text-base flex items-center justify-center gap-1.5 transition-colors ${
                      isOutOfStock
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300"
                        : "bg-[#1C546D] hover:bg-[#164458] text-white cursor-pointer shadow-xs"
                    }`}
                  >
                    {/* <Zap className={`w-4 h-4 ${isOutOfStock ? "fill-gray-400" : "fill-white"}`} /> */}
                    <span>{isOutOfStock ? "Out of Stock" : "Buy It Now"}</span>
                  </button>

                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`w-full py-3 px-3 rounded-md font-medium text-sm sm:text-base flex items-center justify-center gap-1.5 transition-colors ${
                      isOutOfStock
                        ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                        : "border border-[#1C546D] text-[#1C546D] hover:bg-gray-50 cursor-pointer"
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{isOutOfStock ? "Sold Out" : "Add to Cart"}</span>
                  </button>
                </div>
              </div>

              {/* WhatsApp Direct Order / Chat */}
              {whatsappNumber?.trim() && (() => {
                const digits = whatsappNumber.replace(/\D/g, "");
                const waPhone = digits.length === 11 && digits.startsWith("01") ? `88${digits}` : digits;
                const activePrice = product.offerPrice > 0 ? product.offerPrice : product.price;
                const variantInfo = [
                  selectedSize ? `Size: ${selectedSize}` : "",
                  selectedColorName ? `Color: ${selectedColorName}` : "",
                ].filter(Boolean).join(", ");
                const message = encodeURIComponent(
                  `Assalamu Alaikum! I want to order/know more about:\nProduct: ${product.name}\nPrice: ৳${activePrice}${variantInfo ? `\nVariant: ${variantInfo}` : ""}`
                );
                return (
                  <a
                    href={`https://wa.me/${waPhone}?text=${message}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-md font-semibold text-sm sm:text-base bg-[#25D366] hover:bg-[#1ebe5d] text-white flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.344 5l-1.406 5.156 5.281-1.375c1.469.797 3.109 1.219 4.75 1.219 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.813 14.125c-.25.703-1.438 1.344-2 1.422-.516.078-1.172.109-1.891-.125-.438-.141-1-.328-1.719-.641-3.016-1.297-4.984-4.344-5.141-4.547-.141-.203-1.219-1.625-1.219-3.094s.766-2.188 1.047-2.5c.266-.297.594-.375.797-.375.203 0 .391 0 .563.016.188.016.438-.078.688.516.25.609.859 2.094.938 2.25.078.156.125.344.031.547-.109.203-.156.328-.313.516-.156.188-.328.406-.469.547-.156.156-.328.328-.141.641.188.313.844 1.391 1.813 2.25 1.25 1.109 2.297 1.453 2.609 1.609.313.156.5.125.688-.078.188-.203.781-.906.984-1.219.203-.313.406-.266.688-.156.281.109 1.781.844 2.094 1 .313.156.516.234.594.359.078.125.078.734-.172 1.438z" />
                    </svg>
                    <span>WhatsApp: {whatsappNumber}</span>
                  </a>
                );
              })()}

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-500 pt-1">
                <span className="flex items-center gap-1">✓ Cash on Delivery</span>
                <span className="flex items-center gap-1">✓ Free Delivery on 3+ items</span>
                <span className="flex items-center gap-1">✓ 7 Days Easy Return</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs (Description / Size Chart) */}
        <div id="product-tabs" className="mb-12">
          <div className="flex items-center gap-6 border-b border-gray-200 pb-2 mb-4">
            <button
              onClick={() => setActiveTab("description")}
              className={`pb-1 text-base font-semibold transition-colors cursor-pointer ${
                activeTab === "description"
                  ? "text-[#1C546D] border-b-2 border-[#1C546D]"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Description
            </button>

            {product.sizeChart && (
              <button
                onClick={() => setActiveTab("size-chart")}
                className={`pb-1 text-base font-semibold transition-colors cursor-pointer ${
                  activeTab === "size-chart"
                    ? "text-[#1C546D] border-b-2 border-[#1C546D]"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Size Chart
              </button>
            )}
          </div>

          {activeTab === "description" && (
            <div className="text-sm sm:text-base text-gray-700 leading-relaxed max-w-3xl space-y-3">
              <p>
                {product.description ||
                  "Quality kids wear designed for daily comfort and durability."}
              </p>

              {product.richDescription && (
                <div
                  className="rich-content-area pt-2"
                  dangerouslySetInnerHTML={{ __html: product.richDescription }}
                />
              )}
            </div>
          )}

          {activeTab === "size-chart" && product.sizeChart && (
            <div className="space-y-3 max-w-3xl">
              <p className="text-sm text-gray-500">
                Measurement guide in inches for this product:
              </p>
              <div className="relative w-full aspect-[2/1] rounded-md overflow-hidden border border-gray-200 bg-gray-50">
                <Image
                  src={product.sizeChart}
                  alt="Size Chart"
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 750px"
                />
              </div>
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              Related Products
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        )}
      </Container>

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <CheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          items={buyNowItems}
          total={((product.offerPrice > 0 && product.offerPrice < product.price) ? product.offerPrice : product.price) * quantity}
        />
      )}
    </div>
  );
};

export default ProductDetailsClient;
