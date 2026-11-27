"use client";

import Image from "next/image";
import Link from "next/link";
import Container from "@/components/Container";

export const ProductCard = ({ product }) => {
  const productId = product.originalId || product._id || product.id;
  const productName = product.name;
  const colorParam = product.displayColor
    ? `?color=${encodeURIComponent(product.displayColor)}`
    : "";

  const image =
    product.featuredImage ||
    product?.images?.[0] ||
    "/placeholder.svg";

  const hasDiscount = product.offerPrice > 0 && product.offerPrice < product.price;

  return (
    <div className="group bg-white rounded-md border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      {/* Image */}
      <Link
        href={`/product/${productId}${colorParam}`}
        className="relative block w-full aspect-[3/4] overflow-hidden bg-gray-50"
      >
        <Image
          src={image}
          alt={productName}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-102"
        />

        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-[#1C546D] text-white text-[10px] font-medium px-2 py-0.5 rounded-sm">
            SAVE ৳{product.price - product.offerPrice}
          </span>
        )}
      </Link>

      {/* Details */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <Link href={`/product/${productId}${colorParam}`}>
            <h3 className="text-xs sm:text-sm font-medium text-gray-800 line-clamp-1 group-hover:text-[#1C546D] transition-colors">
              {productName}
            </h3>
          </Link>

          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-sm sm:text-base font-bold text-[#1C546D]">
              ৳{product.offerPrice > 0 ? product.offerPrice : product.price}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                ৳{product.price}
              </span>
            )}
          </div>
        </div>

        <Link
          href={`/product/${productId}${colorParam}`}
          className="w-full py-2 bg-gray-100 hover:bg-[#1C546D] hover:text-white text-gray-800 text-xs sm:text-sm font-medium rounded-md text-center transition-colors block"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

const ProductsList = ({ products }) => {
  return (
    <section id="products" className="py-8 md:py-12 bg-white">
      <Container>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg md:text-xl font-bold text-[#1C546D]">
            All Products
          </h2>

          <Link
            href="/shop"
            className="text-xs md:text-sm font-medium text-[#1C546D] hover:underline flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <span>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-5">
          {products?.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default ProductsList;
