import ShopPageClient from "@/components/Shop/ShopPageClient";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ShopPage({ searchParams = {}, categorySlug = null }) {
  let initialProducts = [];
  let initialPagination = { total: 0, page: 1, totalPages: 1, limit: 12 };
  let categories = [];
  let categoryInfo = null;
  let initialSelectedCategories = [];

  try {
    const { db } = await connectToDatabase();

    // 1. Fetch all active categories
    const allCategories = await db
      .collection("categories")
      .find({ isActive: { $ne: false } })
      .sort({ order: 1 })
      .toArray();

    // Format categories
    const categoryMap = {};
    const rootCategories = [];

    allCategories.forEach((cat) => {
      const idStr = cat._id.toString();
      categoryMap[idStr] = {
        ...cat,
        _id: idStr,
        children: [],
      };
    });

    allCategories.forEach((cat) => {
      const idStr = cat._id.toString();
      if (cat.parentId && categoryMap[cat.parentId]) {
        categoryMap[cat.parentId].children.push(categoryMap[idStr]);
      } else {
        rootCategories.push(categoryMap[idStr]);
      }
    });

    categories = rootCategories;

    // 2. Resolve Active Category (from categorySlug or searchParams)
    const activeSlugOrId =
      categorySlug ||
      searchParams?.category ||
      searchParams?.categories?.split(",")?.[0] ||
      null;

    if (activeSlugOrId) {
      // Find matching category by slug or id
      const matchedCat = allCategories.find(
        (c) =>
          c.slug === activeSlugOrId ||
          c._id.toString() === activeSlugOrId ||
          c.name.toLowerCase() === activeSlugOrId.toLowerCase()
      );

      if (matchedCat) {
        const idStr = matchedCat._id.toString();
        categoryInfo = {
          _id: idStr,
          name: matchedCat.name,
          slug: matchedCat.slug,
          description: matchedCat.description || "",
          image: matchedCat.image || "",
        };

        const targetCategoryIds = new Set([idStr]);

        // Include all child subcategories if parent
        allCategories.forEach((c) => {
          if (c.parentId === idStr) {
            targetCategoryIds.add(c._id.toString());
          }
        });

        initialSelectedCategories = Array.from(targetCategoryIds);
      } else if (/^[0-9a-fA-F]{24}$/.test(activeSlugOrId)) {
        initialSelectedCategories = [activeSlugOrId];
      }
    }

    // 3. Query initial products
    const query = {
      isActive: { $ne: false },
      isTrashed: { $ne: true },
    };

    if (initialSelectedCategories.length > 0) {
      query.categories = { $in: initialSelectedCategories };
    }

    const [products, total] = await Promise.all([
      db
        .collection("products")
        .find(query)
        .sort({ createdAt: -1 })
        .limit(12)
        .toArray(),
      db.collection("products").countDocuments(query),
    ]);

    initialProducts = products.map((p) => ({
      ...p,
      _id: p._id.toString(),
      price: Number(p.price || 0),
      offerPrice: Number(p.offerPrice || 0),
    }));

    initialPagination = {
      total,
      page: 1,
      limit: 12,
      totalPages: Math.ceil(total / 12) || 1,
    };
  } catch (err) {
    console.error("Error in ShopPage:", err);
  }

  return (
    <div className="min-h-screen">
      <ShopPageClient
        initialProducts={initialProducts}
        initialPagination={initialPagination}
        categories={categories}
        categoryInfo={categoryInfo}
        initialSelectedCategories={initialSelectedCategories}
      />
    </div>
  );
}
