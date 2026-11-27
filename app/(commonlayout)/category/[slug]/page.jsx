import ShopPage from "@/components/Shop/ShopPage";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    const { db } = await connectToDatabase();

    const category = await db.collection("categories").findOne({
      $or: [{ slug }, { _id: slug }],
    });

    if (category) {
      return {
        title: `${category.name} | Kids Shop`,
        description: category.description || `Browse quality products in ${category.name}`,
      };
    }
  } catch (e) {
    console.error("generateMetadata error:", e);
  }

  return {
    title: "Category Shop | Kids Shop",
    description: "Browse category products",
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const resolvedParams = params ? await params : {};
  const resolvedSearchParams = searchParams ? await searchParams : {};

  return (
    <div>
      <ShopPage
        categorySlug={resolvedParams.slug}
        searchParams={resolvedSearchParams}
      />
    </div>
  );
}
