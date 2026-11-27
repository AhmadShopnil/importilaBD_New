import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/auth"
import { generateSKU } from "@/lib/sku"

export async function GET(request) {
  const admin = await getAdminAuth()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    let query = { productType: "combo" }

    if (status) {
      query.status = status
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ]
    }

    const deliveredStatusMatch = {
      $in: [
        { $toLower: { $ifNull: ["$status", ""] } },
        ["delivered", "complete", "completed"]
      ]
    }

    const [orders, totalCount, stats, statusBreakdown] = await Promise.all([
      db.collection("orders")
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("orders").countDocuments(query),
      db.collection("orders").aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $ifNull: ["$totalAmount", { $ifNull: ["$totalPrice", { $ifNull: ["$offerPrice", { $ifNull: ["$price", 0] }] }] }]
              }
            },
            deliveredRevenue: {
              $sum: {
                $cond: [
                  deliveredStatusMatch,
                  {
                    $ifNull: ["$totalAmount", { $ifNull: ["$totalPrice", { $ifNull: ["$offerPrice", { $ifNull: ["$price", 0] }] }] }]
                  },
                  0
                ]
              }
            },
            deliveredCount: {
              $sum: {
                $cond: [deliveredStatusMatch, 1, 0]
              }
            },
            totalItems: {
              $sum: {
                $reduce: {
                  input: { $ifNull: ["$items", []] },
                  initialValue: 0,
                  in: { $add: ["$$value", { $ifNull: ["$$this.quantity", 1] }] }
                }
              }
            }
          }
        }
      ]).toArray(),
      db.collection("orders").aggregate([
        { $match: { productType: "combo" } },
        {
          $group: {
            _id: { $toLower: { $ifNull: ["$status", "pending"] } },
            count: { $sum: 1 },
            revenue: {
              $sum: {
                $ifNull: ["$totalAmount", { $ifNull: ["$totalPrice", { $ifNull: ["$offerPrice", { $ifNull: ["$price", 0] }] }] }]
              }
            }
          }
        }
      ]).toArray()
    ])

    const totalPages = Math.ceil(totalCount / limit)
    const summary = stats[0] || { totalRevenue: 0, deliveredRevenue: 0, deliveredCount: 0, totalItems: 0 }

    const statusCounts = {
      all: 0,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0
    }

    const statusRevenues = {
      all: 0,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0
    }

    statusBreakdown.forEach((s) => {
      const count = Number(s.count) || 0
      const rev = Number(s.revenue) || 0
      const st = String(s._id || "pending").toLowerCase()

      statusCounts.all += count
      statusRevenues.all += rev

      statusCounts[st] = (statusCounts[st] || 0) + count
      statusRevenues[st] = (statusRevenues[st] || 0) + rev
    })

    return NextResponse.json({
      orders,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit
      },
      summary,
      statusCounts,
      statusRevenues
    })
  } catch (error) {
    console.error("GET /api/orders error:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}



export async function POST(request) {
  try {
    const body = await request.json()

    if (!body.customerName || !body.address || !body.phone) {
      return NextResponse.json({ error: "Missing required fields (customerName, address, phone)" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Fetch store settings for shipping rates
    const settings = await db.collection("settings").findOne({ type: "general" }).catch(() => null)

    // Check combo item stock and gather products
    const bulkUpdates = []
    let totalItems = 0

    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      const objIds = []
      const strIds = []
      for (const item of body.items) {
        if (!item.productId) continue
        const s = String(item.productId)
        strIds.push(s)
        try {
          objIds.push(new ObjectId(s))
        } catch (e) {}
      }

      const products = await db.collection("products").find({
        $or: [
          { _id: { $in: objIds } },
          { _id: { $in: strIds } }
        ]
      }).toArray()

      const productMap = new Map()
      products.forEach((p) => productMap.set(p._id.toString(), p))

      // Pre-validate all items before inserting order
      for (const item of body.items) {
        if (!item.productId) continue

        const product = productMap.get(String(item.productId))
        if (!product || product.isTrashed || product.isActive === false) {
          return NextResponse.json({
            error: `Product "${item.name || item.productId}" in combo is unavailable.`
          }, { status: 400 })
        }

        const reqQty = Number(item.quantity) || 1
        totalItems += reqQty

        const itemColor = String(item.colorName || item.color || "").trim()
        const itemSize = String(item.size || body.productSize || "").trim()

        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
          const variantIndex = product.variants.findIndex((v) =>
            (item.sku && v.sku && v.sku.toLowerCase() === String(item.sku).toLowerCase()) ||
            (
              (String(v.colorName || v.color || "").toLowerCase() === itemColor.toLowerCase()) &&
              (String(v.size || "").toLowerCase() === itemSize.toLowerCase())
            )
          )

          if (variantIndex === -1) {
            return NextResponse.json({
              error: `Variant not found for product "${product.name}" (${itemColor}, ${itemSize})`
            }, { status: 400 })
          }

          const variant = product.variants[variantIndex]
          const availableStock = Number(variant.stock || 0)
          if (availableStock < reqQty) {
            return NextResponse.json({
              error: `"${product.name} - ${variant.colorName || itemColor} ${itemSize}" স্টক শেষ (উপলব্ধ স্টক: ${availableStock})।`
            }, { status: 400 })
          }

          const filter = variant.sku
            ? { _id: product._id, "variants.sku": variant.sku }
            : { _id: product._id, "variants.colorName": variant.colorName || itemColor, "variants.size": itemSize }

          bulkUpdates.push({
            updateOne: {
              filter,
              update: { $inc: { "variants.$.stock": -reqQty } },
            },
          })
        } else {
          if (product.stock !== undefined && Number(product.stock) < reqQty) {
            return NextResponse.json({
              error: `"${product.name}" স্টক শেষ (উপলব্ধ স্টক: ${product.stock})।`
            }, { status: 400 })
          }
          bulkUpdates.push({
            updateOne: {
              filter: { _id: product._id },
              update: { $inc: { stock: -reqQty } }
            }
          })
        }
      }
    }

    // Resolve combo price from DB if comboId or comboSlug provided
    let verifiedPrice = Number(body.offerPrice || body.price || body.totalPrice || 0)
    if (body.comboId || body.comboSlug) {
      let comboDoc = null
      try {
        if (body.comboId) {
          comboDoc = await db.collection("combos").findOne({ _id: new ObjectId(String(body.comboId)) })
        }
      } catch (e) {}
      if (!comboDoc && body.comboSlug) {
        comboDoc = await db.collection("combos").findOne({ slug: body.comboSlug })
      }
      if (comboDoc) {
        verifiedPrice = (Number(comboDoc.offerPrice) > 0 && Number(comboDoc.offerPrice) < Number(comboDoc.price))
          ? Number(comboDoc.offerPrice)
          : Number(comboDoc.price || verifiedPrice)
      }
    }

    // Shipping calculation
    const insideCharge = Number(settings?.insideDhakaCharge) || 60
    const outsideCharge = Number(settings?.outsideDhakaCharge) || 120
    const verifiedShipping = (body.shippingCharge !== undefined && body.shippingCharge !== null)
      ? Number(body.shippingCharge)
      : (body.deliveryLocation === "outside" ? outsideCharge : insideCharge)
    const verifiedTotalAmount = verifiedPrice + verifiedShipping

    // Atomically update stock
    if (bulkUpdates.length > 0) {
      await db.collection("products").bulkWrite(bulkUpdates)
    }

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

    const orderFinalData = {
      ...body,
      orderNumber,
      status: body.status || "pending",
      productType: "combo",
      paymentStatus: body.paymentStatus || "unpaid",
      orderSource: body.orderSource || "website",
      shippingCharge: verifiedShipping,
      subtotal: verifiedPrice,
      totalPrice: verifiedTotalAmount,
      totalAmount: verifiedTotalAmount,
      price: verifiedTotalAmount,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("orders").insertOne(orderFinalData)

    // Update daily sales
    const today = new Date().toISOString().split("T")[0]
    await db.collection("daily_sales").updateOne(
      { date: today },
      {
        $inc: {
          totalRevenue: verifiedTotalAmount,
          totalOrders: 1,
          totalItems: totalItems || 1,
        },
      },
      { upsert: true },
    ).catch(err => console.error("daily_sales update error:", err))

    return NextResponse.json({ _id: result.insertedId, ...orderFinalData }, { status: 201 })
  } catch (error) {
    console.error("POST /api/orders/combo error:", error)
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 })
  }
}
