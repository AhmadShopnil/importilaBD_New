import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import ProductDetailsClient from "@/components/Shop/ProductDetailsClient"
import { notFound } from "next/navigation"
import { getStoreSettings } from "@/lib/dataService"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function generateMetadata({ params }) {
  const { id } = await params
  try {
    const { db } = await connectToDatabase()
    let product = null
    try {
      product = await db.collection("products").findOne({ _id: new ObjectId(id) })
    } catch {
      product = await db.collection("products").findOne({ _id: id })
    }

    if (!product || product.isTrashed) return { title: "Product Not Found" }

    return {
      title: `${product.name} | Importila Kids`,
      description: product.description || "100% skin-safe kids apparel crafted with breathable combed cotton.",
      openGraph: {
        images: [product.featuredImage],
      },
    }
  } catch {
    return { title: "Product | Importila Kids" }
  }
}

export default async function ProductPage({ params }) {
  const { id } = await params
  let product = null
  let relatedProducts = []
  const settings = await getStoreSettings()

  try {
    const { db } = await connectToDatabase()
    let rawProduct = null
    try {
      rawProduct = await db.collection("products").findOne({ _id: new ObjectId(id) })
    } catch {
      rawProduct = await db.collection("products").findOne({ _id: id })
    }

    if (rawProduct && !rawProduct.isTrashed) {
      product = JSON.parse(JSON.stringify(rawProduct))

      const rawRelated = await db.collection("products")
        .find({
          _id: { $ne: rawProduct._id },
          isActive: true,
          isTrashed: false,
        })
        .limit(4)
        .toArray()

      relatedProducts = JSON.parse(JSON.stringify(rawRelated))
    }
  } catch (err) {
    console.error("Error fetching product details:", err)
  }

  if (!product) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-slate-50/50">
      <ProductDetailsClient
        product={product}
        relatedProducts={relatedProducts}
        whatsappNumber={settings?.whatsappNumber || ""}
      />
    </main>
  )
}
