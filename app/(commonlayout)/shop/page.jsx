import ShopPage from "@/components/Shop/ShopPage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Shop Products | Importila",
  description: "Browse all our quality products and collections.",
};

export default async function Page({ searchParams }) {
  const resolvedSearchParams = searchParams ? await searchParams : {};

  return (
    <div>
      <ShopPage searchParams={resolvedSearchParams} />
    </div>
  );
}
