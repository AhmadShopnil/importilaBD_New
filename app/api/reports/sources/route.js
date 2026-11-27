import { connectToDatabase } from "@/lib/mongodb"
import { NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/auth"

export async function GET(request) {
    const admin = await getAdminAuth()
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { searchParams } = new URL(request.url)
        const filter = searchParams.get("filter") || (searchParams.get("month") ? "month" : "30d")
        const month = searchParams.get("month") // Format: YYYY-MM

        const { db } = await connectToDatabase()

        const now = new Date()
        let query = {}

        if (filter === "today") {
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
            query = { createdAt: { $gte: startOfToday } }
        } else if (filter === "yesterday") {
            const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0)
            const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
            query = { createdAt: { $gte: startOfYesterday, $lte: endOfYesterday } }
        } else if (filter === "7d") {
            const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            query = { createdAt: { $gte: start } }
        } else if (filter === "30d") {
            const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            query = { createdAt: { $gte: start } }
        } else if (filter === "this_month") {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
            query = { createdAt: { $gte: startOfMonth } }
        } else if (filter === "month" && month) {
            const startDate = new Date(`${month}-01`)
            const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
            endDate.setHours(23, 59, 59, 999)
            query = { createdAt: { $gte: startDate, $lte: endDate } }
        } else if (filter === "all") {
            query = {}
        }

        const deliveredStatusMatch = {
            $in: [
                { $toLower: { $ifNull: ["$status", ""] } },
                ["delivered", "complete", "completed"]
            ]
        }

        // Aggregate orders by orderSource
        const sourceStats = await db.collection("orders").aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        $toLower: { $ifNull: ["$orderSource", "website"] }
                    },
                    totalOrders: { $sum: 1 },
                    deliveredOrders: {
                        $sum: { $cond: [deliveredStatusMatch, 1, 0] }
                    },
                    cancelledOrders: {
                        $sum: {
                            $cond: [
                                { $regexMatch: { input: { $ifNull: ["$status", ""] }, regex: /cancel/i } },
                                1,
                                0
                            ]
                        }
                    },
                    returnedOrders: {
                        $sum: {
                            $cond: [
                                { $regexMatch: { input: { $ifNull: ["$status", ""] }, regex: /return|rto/i } },
                                1,
                                0
                            ]
                        }
                    },
                    grossRevenue: {
                        $sum: {
                            $ifNull: [
                                "$totalAmount",
                                { $ifNull: ["$totalPrice", { $ifNull: ["$offerPrice", { $ifNull: ["$price", 0] }] }] }
                            ]
                        }
                    },
                    deliveredRevenue: {
                        $sum: {
                            $cond: [
                                deliveredStatusMatch,
                                {
                                    $ifNull: [
                                        "$totalAmount",
                                        { $ifNull: ["$totalPrice", { $ifNull: ["$offerPrice", { $ifNull: ["$price", 0] }] }] }
                                    ]
                                },
                                0
                            ]
                        }
                    },
                    totalItems: {
                        $sum: {
                            $cond: [
                                { $isArray: "$items" },
                                { $sum: "$items.quantity" },
                                1
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    source: "$_id",
                    totalOrders: 1,
                    deliveredOrders: 1,
                    cancelledOrders: 1,
                    returnedOrders: 1,
                    grossRevenue: 1,
                    deliveredRevenue: 1,
                    totalRevenue: "$deliveredRevenue", // Backward compatibility
                    totalItems: 1,
                    _id: 0
                }
            },
            { $sort: { deliveredRevenue: -1, totalOrders: -1 } }
        ]).toArray()

        const enriched = sourceStats.map(s => {
            const closed = s.deliveredOrders + s.returnedOrders + s.cancelledOrders
            const deliveryRate = closed > 0
                ? Number(((s.deliveredOrders / closed) * 100).toFixed(1))
                : (s.totalOrders > 0 ? Number(((s.deliveredOrders / s.totalOrders) * 100).toFixed(1)) : 0)

            const aov = s.deliveredOrders > 0
                ? Math.round(s.deliveredRevenue / s.deliveredOrders)
                : (s.totalOrders > 0 ? Math.round(s.grossRevenue / s.totalOrders) : 0)

            return {
                ...s,
                deliveryRate,
                aov
            }
        })

        return NextResponse.json({ sourceStats: enriched, month })
    } catch (error) {
        console.error("GET /api/reports/sources error:", error)
        return NextResponse.json({ error: "Failed to fetch source report" }, { status: 500 })
    }
}
