import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/auth"

export async function PUT(request, context) {
  const admin = await getAdminAuth()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
   const { id } = await context.params
    const body = await request.json() // { variants: [...] }

    const { db } = await connectToDatabase()

    // Use bulkWrite for all variant updates in a single DB round trip
    const bulkOps = body.variants.map(variant => ({
      updateOne: {
        filter: { _id: new ObjectId(id), "variants.sku": variant.sku },
        update: { $set: { "variants.$.stock": variant.stock } }
      }
    }))

    if (bulkOps.length > 0) {
      await db.collection("products").bulkWrite(bulkOps)
    }

    return NextResponse.json({ message: "Stock updated successfully" })
  } catch (error) {
    console.error("PUT /api/products/[id] error:", error)
    return NextResponse.json({ error: "Failed to update stock" }, { status: 500 })
  }
}
