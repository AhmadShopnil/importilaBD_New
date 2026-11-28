import { connectToDatabase } from "@/lib/mongodb"
import { NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { getCached, setCached } from "@/lib/cache"

export async function GET(request) {
  const admin = await getAdminAuth()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || (searchParams.get("month") ? "month" : "30d")
    const month = searchParams.get("month") // Format: YYYY-MM

    // Check cache first (2 min TTL)
    const cacheKey = `report_sales_${filter}_${month || ""}`
    const cached = getCached(cacheKey)
    if (cached) return NextResponse.json(cached)

    const { db } = await connectToDatabase()

    const now = new Date()
    let matchQuery = {}

    if (filter === "today") {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      matchQuery = { createdAt: { $gte: startOfToday } }
    } else if (filter === "yesterday") {
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0)
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
      matchQuery = { createdAt: { $gte: startOfYesterday, $lte: endOfYesterday } }
    } else if (filter === "7d") {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      matchQuery = { createdAt: { $gte: start } }
    } else if (filter === "30d") {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      matchQuery = { createdAt: { $gte: start } }
    } else if (filter === "this_month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      matchQuery = { createdAt: { $gte: startOfMonth } }
    } else if (filter === "month" && month) {
      const startDate = new Date(`${month}-01`)
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
      endDate.setHours(23, 59, 59, 999)
      matchQuery = { createdAt: { $gte: startDate, $lte: endDate } }
    } else if (filter === "all") {
      matchQuery = {}
    }

    // Aggregate orders in MongoDB instead of fetching all full order documents into memory
    const [aggResult] = await db.collection("orders").aggregate([
      { $match: matchQuery },
      {
        $project: {
          date: {
            $ifNull: [
              { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              "unknown"
            ]
          },
          grossSales: {
            $convert: {
              input: { $ifNull: ["$totalAmount", { $ifNull: ["$totalPrice", 0] }] },
              to: "double",
              onError: 0,
              onNull: 0
            }
          },
          shippingCharge: {
            $convert: {
              input: { $ifNull: ["$shippingCharge", 0] },
              to: "double",
              onError: 0,
              onNull: 0
            }
          },
          isDelivered: {
            $in: [
              { $toLower: { $trim: { input: { $toString: { $ifNull: ["$status", ""] } } } } },
              ["delivered", "complete", "completed"]
            ]
          },
          items: { $ifNull: ["$items", []] }
        }
      },
      {
        $facet: {
          daily: [
            {
              $group: {
                _id: "$date",
                totalOrders: { $sum: 1 },
                deliveredOrders: { $sum: { $cond: ["$isDelivered", 1, 0] } },
                grossSales: { $sum: "$grossSales" },
                deliveredRevenue: { $sum: { $cond: ["$isDelivered", "$grossSales", 0] } },
                shippingCharge: { $sum: { $cond: ["$isDelivered", "$shippingCharge", 0] } },
                totalItems: {
                  $sum: {
                    $cond: [
                      "$isDelivered",
                      {
                        $reduce: {
                          input: "$items",
                          initialValue: 0,
                          in: {
                            $add: [
                              "$$value",
                              { $convert: { input: { $ifNull: ["$$this.quantity", 1] }, to: "double", onError: 1, onNull: 1 } }
                            ]
                          }
                        }
                      },
                      0
                    ]
                  }
                }
              }
            }
          ],
          deliveredItems: [
            { $match: { isDelivered: true } },
            { $unwind: "$items" },
            {
              $group: {
                _id: { date: "$date", productId: "$items.productId" },
                qty: {
                  $sum: {
                    $convert: { input: { $ifNull: ["$items.quantity", 1] }, to: "double", onError: 1, onNull: 1 }
                  }
                }
              }
            }
          ]
        }
      }
    ]).toArray()

    // Get product purchase price map (cached for 5 min, projected to only purchasePrice)
    let productCostMap = getCached("products_cost_map")
    if (!productCostMap) {
      const allProducts = await db.collection("products")
        .find({})
        .project({ purchasePrice: 1 })
        .toArray()
      productCostMap = {}
      allProducts.forEach(p => {
        productCostMap[p._id.toString()] = Number(p.purchasePrice) || 0
      })
      setCached("products_cost_map", productCostMap, 300)
    }

    // Calculate daily cost from deliveredItems
    const dailyCostMap = {}
    for (const row of (aggResult?.deliveredItems || [])) {
      const date = row._id?.date
      const productId = row._id?.productId ? String(row._id.productId) : null
      if (date && productId && productCostMap[productId]) {
        dailyCostMap[date] = (dailyCostMap[date] || 0) + (productCostMap[productId] * (row.qty || 0))
      }
    }

    let grandTotalOrders = 0
    let grandTotalDelivered = 0
    let grandTotalGross = 0
    let grandDeliveredGross = 0
    let grandTotalShipping = 0
    let grandTotalItems = 0
    let grandTotalCost = 0

    const sales = (aggResult?.daily || [])
      .map(day => {
        const date = day._id
        const netSales = day.deliveredRevenue - day.shippingCharge
        const totalCost = dailyCostMap[date] || 0

        grandTotalOrders += day.totalOrders
        grandTotalDelivered += day.deliveredOrders
        grandTotalGross += day.grossSales
        grandDeliveredGross += day.deliveredRevenue
        grandTotalShipping += day.shippingCharge
        grandTotalItems += day.totalItems
        grandTotalCost += totalCost

        const dRate = day.totalOrders > 0
          ? Number(((day.deliveredOrders / day.totalOrders) * 100).toFixed(1))
          : 0
        const aov = day.deliveredOrders > 0
          ? Math.round(day.deliveredRevenue / day.deliveredOrders)
          : (day.totalOrders > 0 ? Math.round(day.grossSales / day.totalOrders) : 0)

        return {
          date,
          totalOrders: day.totalOrders,
          deliveredOrders: day.deliveredOrders,
          grossSales: day.grossSales,
          deliveredRevenue: day.deliveredRevenue,
          shippingCharge: day.shippingCharge,
          netSales,
          totalItems: day.totalItems,
          totalCost,
          deliveryRate: dRate,
          aov,
          netRevenue: netSales,
          profit: netSales - totalCost
        }
      })
      .sort((a, b) => b.date.localeCompare(a.date))

    const overallDeliveryRate = grandTotalOrders > 0
      ? Number(((grandTotalDelivered / grandTotalOrders) * 100).toFixed(1))
      : 0

    const overallAov = grandTotalDelivered > 0
      ? Math.round(grandDeliveredGross / grandTotalDelivered)
      : (grandTotalOrders > 0 ? Math.round(grandTotalGross / grandTotalOrders) : 0)

    const totals = {
      totalOrders: grandTotalOrders,
      deliveredOrders: grandTotalDelivered,
      deliveryRate: overallDeliveryRate,
      totalGross: grandTotalGross,
      deliveredRevenue: grandDeliveredGross,
      totalShipping: grandTotalShipping,
      totalNet: grandDeliveredGross - grandTotalShipping,
      netRevenue: grandDeliveredGross - grandTotalShipping,
      totalProfit: (grandDeliveredGross - grandTotalShipping) - grandTotalCost,
      totalItems: grandTotalItems,
      avgOrderValue: overallAov
    }

    const response = { sales, totals, month }
    setCached(cacheKey, response, 120)
    return NextResponse.json(response)
  } catch (error) {
    console.error("GET /api/reports/sales error:", error)
    return NextResponse.json({ error: "Failed to fetch sales report", details: error.message }, { status: 500 })
  }
}
