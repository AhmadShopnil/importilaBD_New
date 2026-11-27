"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Container from "@/components/Container";
import { ProductCard } from "@/components/Home/ProductList/ProductList";
import { BASE_URL } from "@/utils/baseUrl";

function ShopContent({
  initialProducts,
  initialPagination,
  categories: initialCategories,
  categoryInfo = null,
  initialSelectedCategories = [],
}) {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState(initialProducts || []);
  const [pagination, setPagination] = useState(
    initialPagination || { page: 1, totalPages: 1, total: 0 }
  );
  const [loading, setLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Flatten categories
  const flatCategories = useMemo(() => {
    const flatten = (items) => {
      return items.reduce((acc, item) => {
        acc.push(item);
        if (item.children && item.children.length > 0) {
          acc.push(...flatten(item.children));
        }
        return acc;
      }, []);
    };
    return flatten(initialCategories || []);
  }, [initialCategories]);

  // Initial category IDs
  const computedInitialCategories = useMemo(() => {
    if (initialSelectedCategories && initialSelectedCategories.length > 0) {
      return initialSelectedCategories;
    }
    const queryCategory = searchParams?.get("category") || searchParams?.get("categories");
    if (queryCategory) {
      const tokens = queryCategory.split(",").map((t) => t.trim().toLowerCase());
      const matched = flatCategories
        .filter((c) => tokens.includes(c._id) || tokens.includes(c.slug?.toLowerCase()))
        .map((c) => c._id);
      if (matched.length > 0) return matched;
      return tokens;
    }
    return [];
  }, [initialSelectedCategories, searchParams, flatCategories]);

  // Filters state
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(computedInitialCategories);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [sort, setSort] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Sync if URL query parameters change (e.g. user clicked category link in navbar while on /shop)
  useEffect(() => {
    const queryCategory = searchParams?.get("category") || searchParams?.get("categories");
    if (queryCategory) {
      const tokens = queryCategory.split(",").map((t) => t.trim().toLowerCase());
      const matched = flatCategories
        .filter((c) => tokens.includes(c._id) || tokens.includes(c.slug?.toLowerCase()))
        .map((c) => c._id);
      const newSelected = matched.length > 0 ? matched : tokens;
      setSelectedCategories(newSelected);
      setHasUserInteracted(true);
    }
  }, [searchParams, flatCategories]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategories.length > 0) {
        params.append("categories", selectedCategories.join(","));
      }
      if (priceRange.min > 0) params.append("minPrice", priceRange.min);
      if (priceRange.max < 10000) params.append("maxPrice", priceRange.max);
      params.append("sort", sort);
      params.append("page", currentPage);
      params.append("limit", 12);

      const res = await fetch(`${BASE_URL}/api/products?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
        setPagination(
          data.pagination || {
            page: currentPage,
            totalPages: 1,
            total: data.products?.length || 0,
          }
        );
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategories, priceRange, sort, currentPage]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (hasUserInteracted || search) {
        fetchProducts();
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  useEffect(() => {
    if (!hasUserInteracted) return;
    if (currentPage === 1) {
      fetchProducts();
    } else {
      setCurrentPage(1);
    }
  }, [selectedCategories, priceRange, sort, hasUserInteracted]);

  useEffect(() => {
    if (!hasUserInteracted) return;
    fetchProducts();
  }, [currentPage]);

  const toggleCategory = (catId) => {
    setHasUserInteracted(true);
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const clearFilters = () => {
    setHasUserInteracted(true);
    setSelectedCategories([]);
    setPriceRange({ min: 0, max: 10000 });
    setSearch("");
    setSort("newest");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategories.length > 0 ||
    priceRange.min > 0 ||
    priceRange.max < 10000;

  // Active Category title resolution
  const currentCategory = useMemo(() => {
    if (categoryInfo) return categoryInfo;
    if (selectedCategories.length === 1) {
      return flatCategories.find((c) => c._id === selectedCategories[0]) || null;
    }
    return null;
  }, [categoryInfo, selectedCategories, flatCategories]);

  return (
    <section className="py-6 md:py-10 bg-white min-h-screen">
      <Container>
        {/* Breadcrumb & Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-gray-900 transition-colors">
              Shop
            </Link>
            {currentCategory && (
              <>
                <span>/</span>
                <span className="text-gray-900 font-medium">
                  {currentCategory.name}
                </span>
              </>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                {currentCategory ? currentCategory.name : "Shop Products"}
              </h1>
              {currentCategory?.description && (
                <p className="text-xs text-gray-500 mt-1 max-w-2xl">
                  {currentCategory.description}
                </p>
              )}
            </div>
            {selectedCategories.length > 1 && (
              <span className="text-xs bg-sky-50 text-sky-800 px-2.5 py-1 rounded-md font-medium border border-sky-100">
                {selectedCategories.length} Categories Selected
              </span>
            )}
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-md border border-gray-200 p-4 sticky top-20 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-[#1C546D]" /> Filters
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-red-600 hover:underline font-medium cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => {
                      setHasUserInteracted(true);
                      setSearch(e.target.value);
                    }}
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:border-gray-400"
                  />
                  {search && (
                    <button
                      onClick={() => {
                        setHasUserInteracted(true);
                        setSearch("");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Categories */}
              {flatCategories.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 uppercase">
                      Categories
                    </label>
                    {selectedCategories.length > 0 && (
                      <button
                        onClick={() => {
                          setHasUserInteracted(true);
                          setSelectedCategories([]);
                        }}
                        className="text-[11px] text-[#1C546D] hover:underline font-medium cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                    {flatCategories.map((cat) => {
                      const isChecked = selectedCategories.includes(cat._id);
                      return (
                        <button
                          key={cat._id}
                          onClick={() => toggleCategory(cat._id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                            isChecked
                              ? "bg-[#1C546D] text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <span className="truncate text-left">{cat.name}</span>
                          {isChecked && <span className="text-[10px] ml-1">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Price Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase">
                  Price
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      setHasUserInteracted(true);
                      setPriceRange({ min: 0, max: 500 });
                    }}
                    className={`py-1 px-2 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                      priceRange.max === 500
                        ? "border-[#1C546D] bg-[#1C546D] text-white"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Under ৳500
                  </button>
                  <button
                    onClick={() => {
                      setHasUserInteracted(true);
                      setPriceRange({ min: 500, max: 1000 });
                    }}
                    className={`py-1 px-2 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                      priceRange.min === 500 && priceRange.max === 1000
                        ? "border-[#1C546D] bg-[#1C546D] text-white"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    ৳500 - ৳1,000
                  </button>
                  <button
                    onClick={() => {
                      setHasUserInteracted(true);
                      setPriceRange({ min: 1000, max: 10000 });
                    }}
                    className={`py-1 px-2 rounded-md text-xs font-medium border col-span-2 transition-colors cursor-pointer ${
                      priceRange.min === 1000
                        ? "border-[#1C546D] bg-[#1C546D] text-white"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    ৳1,000 & Above
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Grid */}
          <main className="lg:col-span-3 space-y-4">
            {/* Toolbar */}
            <div className="bg-white rounded-md border border-gray-200 p-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-100 text-gray-800 text-xs font-medium cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" /> Filters
                </button>
                <span className="text-xs text-gray-500">
                  Showing {products.length} products
                </span>
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs text-gray-500 hidden sm:inline">Sort:</span>
                <select
                  value={sort}
                  onChange={(e) => {
                    setHasUserInteracted(true);
                    setSort(e.target.value);
                  }}
                  className="text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-gray-100 rounded-md" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-md border border-gray-200 p-8 text-center max-w-sm mx-auto space-y-3">
                <p className="text-sm font-semibold text-gray-800">No products found</p>
                <p className="text-xs text-gray-500">
                  No products matched the selected filters.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-1.5 rounded-md bg-[#1C546D] text-white text-xs font-medium cursor-pointer hover:bg-[#164458] transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pt-4 flex items-center justify-center gap-1.5">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => {
                    setHasUserInteracted(true);
                    setCurrentPage((p) => Math.max(1, p - 1));
                  }}
                  className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setHasUserInteracted(true);
                      setCurrentPage(i + 1);
                    }}
                    className={`w-7 h-7 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      currentPage === i + 1
                        ? "bg-[#1C546D] text-white"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage >= pagination.totalPages}
                  onClick={() => {
                    setHasUserInteracted(true);
                    setCurrentPage((p) => Math.min(pagination.totalPages, p + 1));
                  }}
                  className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                </button>
              </div>
            )}
          </main>
        </div>
      </Container>

      {/* Mobile Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={() => setIsFilterOpen(false)}
            className="fixed inset-0 bg-black/40"
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full p-4 shadow-xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <span className="font-semibold text-gray-900 text-sm">Filters</span>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Search</label>
                <input
                  type="text"
                  placeholder="Product name..."
                  value={search}
                  onChange={(e) => {
                    setHasUserInteracted(true);
                    setSearch(e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md"
                />
              </div>

              {/* Categories */}
              {flatCategories.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">Categories</label>
                  <div className="space-y-1 max-h-56 overflow-y-auto">
                    {flatCategories.map((cat) => {
                      const isChecked = selectedCategories.includes(cat._id);
                      return (
                        <button
                          key={cat._id}
                          onClick={() => toggleCategory(cat._id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium cursor-pointer ${
                            isChecked
                              ? "bg-[#1C546D] text-white"
                              : "text-gray-700 bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          <span>{cat.name}</span>
                          {isChecked && <span>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="w-full py-2 rounded-md bg-[#1C546D] text-white font-medium text-xs cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function ShopPageClient(props) {
  return (
    <Suspense
      fallback={
        <section className="py-10 bg-white min-h-screen">
          <Container>
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded" />
              <div className="h-8 w-48 bg-gray-200 rounded" />
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-6">
                <div className="h-64 bg-gray-100 rounded-md" />
                <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-gray-100 rounded-md" />
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </section>
      }
    >
      <ShopContent {...props} />
    </Suspense>
  );
}
