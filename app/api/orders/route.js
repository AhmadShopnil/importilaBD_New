import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/auth"

export async function GET(request) {
  const admin = await getAdminAuth()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const type = searchParams.get("type") || "regular" // "regular" | "combo" | "all"
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const skip = (page - 1) * limit

    let query = {}
    if (type === "combo") {
      query.productType = "combo"
    } else if (type === "regular") {
      query.productType = { $ne: "combo" }
    }
    // if type === "all", no productType filter

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

    const [orders, totalCount, stats, statusBreakdown, storeBreakdown] = await Promise.all([
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
        { $match: query.productType !== undefined ? { productType: query.productType } : {} },
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
      ]).toArray(),
      db.collection("orders").aggregate([
        {
          $group: {
            _id: { $cond: [{ $eq: ["$productType", "combo"] }, "combo", "regular"] },
            count: { $sum: 1 },
            deliveredRevenue: {
              $sum: {
                $cond: [
                  deliveredStatusMatch,
                  { $ifNull: ["$totalAmount", { $ifNull: ["$totalPrice", { $ifNull: ["$offerPrice", { $ifNull: ["$price", 0] }] }] }] },
                  0
                ]
              }
            },
            deliveredCount: {
              $sum: { $cond: [deliveredStatusMatch, 1, 0] }
            }
          }
        }
      ]).toArray()
    ])

    const totalPages = Math.ceil(totalCount / limit)
    const baseSummary = stats[0] || { totalRevenue: 0, deliveredRevenue: 0, deliveredCount: 0, totalItems: 0 }

    let regularDeliveredRevenue = 0
    let comboDeliveredRevenue = 0
    let storeDeliveredRevenue = 0

    storeBreakdown.forEach((group) => {
      if (group._id === "combo") {
        comboDeliveredRevenue += group.deliveredRevenue || 0
      } else {
        regularDeliveredRevenue += group.deliveredRevenue || 0
      }
      storeDeliveredRevenue += group.deliveredRevenue || 0
    })

    const summary = {
      ...baseSummary,
      scope: type,
      regularDeliveredRevenue,
      comboDeliveredRevenue,
      storeDeliveredRevenue
    }

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

    if (!body.customerName || !body.address || !body.phone || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Missing required fields (customerName, address, phone, items)" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Fetch settings for official shipping rates
    const settings = await db.collection("settings").findOne({ type: "general" }).catch(() => null)

    // Gather all product IDs from the items (supporting both ObjectId and string IDs)
    const objIds = []
    const strIds = []
    for (const it of body.items) {
      const pid = it.productId || it.originalId || it._id || it.id
      if (!pid) continue
      const s = String(pid)
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
    products.forEach((p) => {
      productMap.set(p._id.toString(), p)
    })

    let calculatedSubtotal = 0
    let totalItemCount = 0
    const verifiedItems = []
    const bulkUpdates = []

    // Validate every item, check stock, and resolve price from database
    for (const item of body.items) {
      const pid = String(item.productId || item.originalId || item._id || item.id || "")
      const product = productMap.get(pid)

      if (!product || product.isTrashed || product.isActive === false) {
        return NextResponse.json({
          error: `Product "${item.name || pid}" is currently unavailable or inactive.`
        }, { status: 400 })
      }

      const reqQty = Math.max(1, Number(item.quantity) || 1)
      totalItemCount += reqQty

      const itemColor = String(item.colorName || item.color || "").trim()
      const itemSize = String(item.size || item.selectedSize || "").trim()
      let matchedVariant = null

      // Check variant stock if product has variants
      if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
        const variantIndex = product.variants.findIndex((v) =>
          (item.sku && v.sku && v.sku.toLowerCase() === String(item.sku).toLowerCase()) ||
          (
            (String(v.colorName || v.color || "").toLowerCase() === itemColor.toLowerCase()) &&
            (String(v.size || "").toLowerCase() === itemSize.toLowerCase())
          )
        )

        if (variantIndex !== -1) {
          matchedVariant = product.variants[variantIndex]
          const availableStock = Number(matchedVariant.stock || 0)
          if (availableStock < reqQty) {
            return NextResponse.json({
              error: `"${product.name} (${matchedVariant.colorName || itemColor} - ${matchedVariant.size || itemSize})" স্টক শেষ (উপলব্ধ স্টক: ${availableStock}, আপনি চেয়েছেন: ${reqQty})। অনুগ্রহ করে অন্য সাইজ/কালার নির্বাচন করুন।`
            }, { status: 400 })
          }

          const filter = matchedVariant.sku
            ? { _id: product._id, "variants.sku": matchedVariant.sku }
            : { _id: product._id, "variants.colorName": matchedVariant.colorName, "variants.size": matchedVariant.size }

          bulkUpdates.push({
            updateOne: {
              filter,
              update: { $inc: { "variants.$.stock": -reqQty } }
            }
          })
        } else {
          return NextResponse.json({
            error: `Selected option (${itemColor} - ${itemSize}) for "${product.name}" was not found.`
          }, { status: 400 })
        }
      } else {
        // Flat product without variants
        if (product.stock !== undefined) {
          const availableStock = Number(product.stock || 0)
          if (availableStock < reqQty) {
            return NextResponse.json({
              error: `"${product.name}" স্টক শেষ (উপলব্ধ স্টক: ${availableStock})।`
            }, { status: 400 })
          }
        }

        bulkUpdates.push({
          updateOne: {
            filter: { _id: product._id },
            update: { $inc: { stock: -reqQty } }
          }
        })
      }

      // CRITICAL: Price MUST be taken from the database, NEVER trust frontend input
      const officialPrice = (Number(product.offerPrice) > 0 && Number(product.offerPrice) < Number(product.price))
        ? Number(product.offerPrice)
        : Number(product.price || 0)

      const lineTotal = officialPrice * reqQty
      calculatedSubtotal += lineTotal

      verifiedItems.push({
        productId: product._id.toString(),
        name: product.name,
        title: product.name,
        color: matchedVariant?.colorName || itemColor || "Standard",
        colorName: matchedVariant?.colorName || itemColor || "Standard",
        colorHex: matchedVariant?.colorHex || item.colorHex || "",
        size: matchedVariant?.size || itemSize || "Standard",
        sku: matchedVariant?.sku || item.sku || "",
        image: matchedVariant?.image || product.featuredImage || product.images?.[0] || item.image || "",
        price: officialPrice, // Strictly database price
        originalPrice: Number(product.price || officialPrice),
        offerPrice: Number(product.offerPrice || 0),
        quantity: reqQty,
        lineTotal
      })
    }

    // Shipping calculation (free shipping on 3 or more items store policy)
    const insideCharge = Number(settings?.insideDhakaCharge) || 60
    const outsideCharge = Number(settings?.outsideDhakaCharge) || 120
    const verifiedShipping = totalItemCount >= 3 ? 0 : (body.deliveryLocation === "outside" ? outsideCharge : insideCharge)
    const verifiedTotalAmount = calculatedSubtotal + verifiedShipping

    // Atomically deduct stock from database
    if (bulkUpdates.length > 0) {
      await db.collection("products").bulkWrite(bulkUpdates)
    }

    // Insert order with verified data
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

    const orderData = {
      orderNumber,
      customerName: String(body.customerName).trim(),
      phone: String(body.phone).trim(),
      address: String(body.address).trim(),
      note: String(body.note || "").trim(),
      deliveryLocation: body.deliveryLocation || "inside",
      shippingCharge: verifiedShipping,
      subtotal: calculatedSubtotal,
      totalPrice: verifiedTotalAmount,
      totalAmount: verifiedTotalAmount,
      price: verifiedTotalAmount,
      items: verifiedItems,
      productType: body.productType || "regular",
      status: "pending",
      paymentStatus: "unpaid",
      orderSource: body.orderSource || "website",
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("orders").insertOne(orderData)

    // Update daily sales with verified figures
    const today = new Date().toISOString().split("T")[0]
    await db.collection("daily_sales").updateOne(
      { date: today },
      {
        $inc: {
          totalRevenue: verifiedTotalAmount,
          totalOrders: 1,
          totalItems: totalItemCount
        }
      },
      { upsert: true }
    ).catch(err => console.error("daily_sales update error:", err))

    return NextResponse.json({ _id: result.insertedId, ...orderData }, { status: 201 })
  } catch (error) {
    console.error("POST /api/orders error:", error)
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 })
  }
}

export async function DELETE(request) {
  const admin = await getAdminAuth()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { ids } = await request.json()
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: "Invalid or missing order IDs" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const result = await db.collection("orders").deleteMany({
      _id: { $in: ids.map(id => new ObjectId(id)) }
    })

    return NextResponse.json({
      message: `${result.deletedCount} orders deleted successfully`,
      deletedCount: result.deletedCount
    })
  } catch (error) {
    console.error("DELETE /api/orders error:", error)
    return NextResponse.json({ error: "Failed to delete orders" }, { status: 500 })
  }
}
