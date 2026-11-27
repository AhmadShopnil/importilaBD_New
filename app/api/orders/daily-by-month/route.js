import { connectToDatabase } from "@/lib/mongodb"
import { NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/auth"

export async function GET(request) {
  const admin = await getAdminAuth()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month") ? Number(searchParams.get("month")) : null
    const year = Number(searchParams.get("year")) || new Date().getFullYear()
    const view = searchParams.get("view") // "yearly" | "daily"

    const { db } = await connectToDatabase()

    // 1. Yearly overview mode (Month-over-Month 1-12)
    if (view === "yearly" || !month) {
      const startOfYear = new Date(year, 0, 1)
      const endOfYear = new Date(year + 1, 0, 1)

      const rawData = await db.collection("orders").aggregate([
        {
          $match: {
            createdAt: { $gte: startOfYear, $lt: endOfYear }
          }
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            orders: { $sum: 1 },
            revenue: {
              $sum: {
                $ifNull: [
                  "$totalAmount",
                  { $ifNull: ["$totalPrice", { $ifNull: ["$offerPrice", { $ifNull: ["$price", 0] }] }] }
                ]
              }
            },
            deliveredOrders: {
              $sum: {
                $cond: [
                  { $in: [{ $toLower: { $ifNull: ["$status", ""] } }, ["delivered", "complete", "completed"]] },
                  1,
                  0
                ]
              }
            },
            deliveredRevenue: {
              $sum: {
                $cond: [
                  { $in: [{ $toLower: { $ifNull: ["$status", ""] } }, ["delivered", "complete", "completed"]] },
                  {
                    $ifNull: [
                      "$totalAmount",
                      { $ifNull: ["$totalPrice", { $ifNull: ["$offerPrice", { $ifNull: ["$price", 0] }] }] }
                    ]
                  },
                  0
                ]
              }
            }
          }
        },
        { $sort: { "_id": 1 } }
      ]).toArray()

      const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const yearlyData = Array.from({ length: 12 }, (_, i) => {
        const m = i + 1
        const found = rawData.find(d => d._id === m)
        return {
          month: m,
          name: MONTH_NAMES[i],
          orders: found?.orders || 0,
          revenue: found?.revenue || 0,
          deliveredOrders: found?.deliveredOrders || 0,
          deliveredRevenue: found?.deliveredRevenue || 0,
        }
      })

      return NextResponse.json(yearlyData)
    }

    // 2. Daily mode for a specific month
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 1)

    const rawData = await db.collection("orders").aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lt: end
          }
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          orders: { $sum: 1 },
          revenue: {
            $sum: {
              $ifNull: [
                "$totalAmount",
                { $ifNull: ["$totalPrice", { $ifNull: ["$offerPrice", { $ifNull: ["$price", 0] }] }] }
              ]
            }
          },
          deliveredOrders: {
            $sum: {
              $cond: [
                { $in: [{ $toLower: { $ifNull: ["$status", ""] } }, ["delivered", "complete", "completed"]] },
                1,
                0
              ]
            }
          },
          deliveredRevenue: {
            $sum: {
              $cond: [
                { $in: [{ $toLower: { $ifNull: ["$status", ""] } }, ["delivered", "complete", "completed"]] },
                {
                  $ifNull: [
                    "$totalAmount",
                    { $ifNull: ["$totalPrice", { $ifNull: ["$offerPrice", { $ifNull: ["$price", 0] }] }] }
                  ]
                },
                0
              ]
            }
          }
        }
      },
      { $sort: { "_id": 1 } }
    ]).toArray()

    const daysInMonth = new Date(year, month, 0).getDate()

    const data = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      const found = rawData.find(d => d._id === day)

      return {
        day,
        orders: found?.orders || 0,
        revenue: found?.revenue || 0,
        deliveredOrders: found?.deliveredOrders || 0,
        deliveredRevenue: found?.deliveredRevenue || 0,
      }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("GET /api/orders/daily-by-month error:", error)
    return NextResponse.json(
      { error: "Failed to fetch orders data" },
      { status: 500 }
    )
  }
}
