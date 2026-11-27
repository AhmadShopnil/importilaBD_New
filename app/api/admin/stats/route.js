import { connectToDatabase } from "@/lib/mongodb"
import { NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/auth"
import { getCached, setCached } from "@/lib/cache"

export async function GET(request) {
    const admin = await getAdminAuth()
    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const filter = searchParams.get("filter") || "all"
        const month = parseInt(searchParams.get("month"))
        const year = parseInt(searchParams.get("year"))

        const cacheKey = `admin_stats_${filter}_${month || 0}_${year || 0}`
        const cached = getCached(cacheKey)
        if (cached) {
            return NextResponse.json(cached, {
                headers: {
                    "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
                    "X-Cache": "HIT"
                }
            })
        }

        const { db } = await connectToDatabase()

        /* -------------------- Date Filter -------------------- */
        const now = new Date()
        let dateQuery = {}

        if (filter === "today") {
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
            dateQuery = { createdAt: { $gte: startOfToday } }
        } else if (filter === "yesterday") {
            const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0)
            const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
            dateQuery = { createdAt: { $gte: startOfYesterday, $lte: endOfYesterday } }
        } else if (filter === "7d") {
            const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            dateQuery = { createdAt: { $gte: start } }
        } else if (filter === "30d") {
            const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            dateQuery = { createdAt: { $gte: start } }
        } else if (filter === "this_month") {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
            dateQuery = { createdAt: { $gte: startOfMonth } }
        } else if (filter === "last_month") {
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0)
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
            dateQuery = { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }
        } else if (filter === "month" && month && year) {
            dateQuery = {
                createdAt: {
                    $gte: new Date(year, month - 1, 1, 0, 0, 0, 0),
                    $lte: new Date(year, month, 0, 23, 59, 59, 999),
                },
            }
        }

        const deliveredStatusMatch = {
            $in: [
                { $toLower: { $ifNull: ["$status", ""] } },
                ["delivered", "complete", "completed"]
            ]
        }

        /* -------------------- Aggregation -------------------- */
        const stats = await db.collection("orders").aggregate([
            { $match: dateQuery },

            {
                $facet: {
                    /* ---- Order Summary & Status Breakdown ---- */
                    summary: [
                        {
                            $group: {
                                _id: null,
                                totalOrders: { $sum: 1 },
                                pendingOrders: {
                                    $sum: {
                                        $cond: [
                                            { $regexMatch: { input: { $ifNull: ["$status", ""] }, regex: /pending|incomplete/i } },
                                            1,
                                            0
                                        ],
                                    },
                                },
                                confirmedOrders: {
                                    $sum: {
                                        $cond: [
                                            { $regexMatch: { input: { $ifNull: ["$status", ""] }, regex: /confirm|process/i } },
                                            1,
                                            0
                                        ],
                                    },
                                },
                                inTransitOrders: {
                                    $sum: {
                                        $cond: [
                                            { $regexMatch: { input: { $ifNull: ["$status", ""] }, regex: /ship|transit|courier/i } },
                                            1,
                                            0
                                        ],
                                    },
                                },
                                deliveredOrders: {
                                    $sum: {
                                        $cond: [deliveredStatusMatch, 1, 0],
                                    },
                                },
                                cancelledOrders: {
                                    $sum: {
                                        $cond: [
                                            { $regexMatch: { input: { $ifNull: ["$status", ""] }, regex: /cancel/i } },
                                            1,
                                            0
                                        ],
                                    },
                                },
                                returnedOrders: {
                                    $sum: {
                                        $cond: [
                                            { $regexMatch: { input: { $ifNull: ["$status", ""] }, regex: /return|rto/i } },
                                            1,
                                            0
                                        ],
                                    },
                                },
                                grossSales: {
                                    $sum: {
                                        $ifNull: [
                                            "$totalAmount",
                                            { $ifNull: ["$totalPrice", { $ifNull: ["$offerPrice", { $ifNull: ["$price", 0] }] }] }
                                        ]
                                    }
                                }
                            },
                        },
                    ],

                    /* ---- Financials (Delivered Only) ---- */
                    financials: [
                        {
                            $match: {
                                $expr: {
                                    $in: [
                                        { $toLower: { $ifNull: ["$status", ""] } },
                                        ["delivered", "complete", "completed"]
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                deliveredSales: {
                                    $sum: {
                                        $ifNull: [
                                            "$totalAmount",
                                            { $ifNull: ["$totalPrice", { $ifNull: ["$offerPrice", { $ifNull: ["$price", 0] }] }] }
                                        ]
                                    }
                                },
                                totalDiscount: { $sum: { $ifNull: ["$discount", 0] } },
                                shippingCollected: { $sum: { $ifNull: ["$shippingCharge", 0] } },
                            },
                        },
                    ],

                    /* ---- Status Distribution ---- */
                    statusDistribution: [
                        {
                            $group: {
                                _id: { $toLower: { $ifNull: ["$status", "pending"] } },
                                count: { $sum: 1 },
                                revenue: {
                                    $sum: {
                                        $ifNull: [
                                            "$totalAmount",
                                            { $ifNull: ["$totalPrice", { $ifNull: ["$offerPrice", { $ifNull: ["$price", 0] }] }] }
                                        ]
                                    }
                                }
                            },
                        },
                        { $sort: { count: -1 } }
                    ],

                    /* ---- Source Distribution with Revenue & Delivery Rate ---- */
                    sourceDistribution: [
                        {
                            $group: {
                                _id: {
                                    $toLower: {
                                        $ifNull: ["$orderSource", "website"]
                                    }
                                },
                                count: { $sum: 1 },
                                deliveredOrders: {
                                    $sum: {
                                        $cond: [deliveredStatusMatch, 1, 0]
                                    }
                                },
                                grossSales: {
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
                                }
                            },
                        },
                        { $sort: { deliveredRevenue: -1, count: -1 } }
                    ],

                    /* ---- Top Selling Items ---- */
                    topProducts: [
                        { $unwind: "$items" },
                        {
                            $group: {
                                _id: {
                                    $ifNull: ["$items.productId", "$items.title"]
                                },
                                title: { $first: "$items.title" },
                                image: { $first: "$items.image" },
                                quantity: { $sum: { $ifNull: ["$items.quantity", 1] } },
                                revenue: {
                                    $sum: {
                                        $multiply: [
                                            { $ifNull: ["$items.price", 0] },
                                            { $ifNull: ["$items.quantity", 1] }
                                        ]
                                    }
                                },
                                deliveredQuantity: {
                                    $sum: {
                                        $cond: [deliveredStatusMatch, { $ifNull: ["$items.quantity", 1] }, 0]
                                    }
                                }
                            }
                        },
                        { $sort: { quantity: -1, revenue: -1 } },
                        { $limit: 6 }
                    ]
                },
            },
        ]).toArray()

        const summary = stats[0]?.summary?.[0] || {}
        const financials = stats[0]?.financials?.[0] || {}
        const topProducts = stats[0]?.topProducts || []

        const totalOrders = summary.totalOrders || 0
        const deliveredOrders = summary.deliveredOrders || 0
        const pendingOrders = summary.pendingOrders || 0
        const confirmedOrders = summary.confirmedOrders || 0
        const inTransitOrders = summary.inTransitOrders || 0
        const cancelledOrders = summary.cancelledOrders || 0
        const returnedOrders = summary.returnedOrders || 0
        const grossSales = summary.grossSales || 0

        const deliveredSales = financials.deliveredSales || 0
        const totalDiscount = financials.totalDiscount || 0
        const shippingCollected = financials.shippingCollected || 0
        const netProductSales = deliveredSales - shippingCollected

        // Closed orders = delivered + returned + cancelled
        const closedOrders = deliveredOrders + returnedOrders + cancelledOrders
        const deliveryRate = closedOrders > 0
            ? Number(((deliveredOrders / closedOrders) * 100).toFixed(1))
            : (totalOrders > 0 ? Number(((deliveredOrders / totalOrders) * 100).toFixed(1)) : 0)

        const returnRate = (deliveredOrders + returnedOrders) > 0
            ? Number(((returnedOrders / (deliveredOrders + returnedOrders)) * 100).toFixed(1))
            : 0

        const cancellationRate = totalOrders > 0
            ? Number(((cancelledOrders / totalOrders) * 100).toFixed(1))
            : 0

        const aov = deliveredOrders > 0
            ? Math.round(deliveredSales / deliveredOrders)
            : (totalOrders > 0 ? Math.round(grossSales / totalOrders) : 0)

        /* -------------------- Inventory Stats -------------------- */
        const settingsDoc = await db.collection("settings").findOne({ type: "general" })
        const lowStockThreshold = settingsDoc?.lowStockThreshold || 10

        const totalProducts = await db.collection("products").countDocuments({ isTrashed: { $ne: true } })
        const lowStockItems = await db.collection("products").countDocuments({
            isTrashed: { $ne: true },
            "variants.stock": { $lt: lowStockThreshold },
        })

        // Enhance source distribution with AOV and Delivery Rate
        const sourceDistribution = (stats[0]?.sourceDistribution || []).map(src => ({
            _id: src._id,
            count: src.count,
            deliveredOrders: src.deliveredOrders,
            grossSales: src.grossSales,
            deliveredRevenue: src.deliveredRevenue,
            deliveryRate: src.count > 0 ? Number(((src.deliveredOrders / src.count) * 100).toFixed(1)) : 0,
            aov: src.deliveredOrders > 0
                ? Math.round(src.deliveredRevenue / src.deliveredOrders)
                : (src.count > 0 ? Math.round(src.grossSales / src.count) : 0)
        }))

        const responseData = {
            // Core Counts
            totalProducts,
            totalOrders,
            pendingOrders,
            confirmedOrders,
            inTransitOrders,
            deliveredOrders,
            cancelledOrders,
            returnedOrders,

            // Financial KPIs
            grossSales,
            deliveredSales,
            netSales: deliveredSales, // Standard Net Delivered Sales
            netProductSales,
            shippingCollected,
            totalShippingSpent: shippingCollected, // Maintain backward compatibility
            totalSales: deliveredSales, // Maintain backward compatibility
            totalDiscount,
            aov,

            // Performance Rates
            deliveryRate,
            returnRate,
            cancellationRate,

            // Inventory
            lowStockItems,

            // Visual Distributions & Top Products
            statusDistribution: stats[0]?.statusDistribution || [],
            sourceDistribution,
            topProducts
        }

        setCached(cacheKey, responseData, 30)

        return NextResponse.json(responseData, {
            headers: {
                "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
                "X-Cache": "MISS"
            }
        })
    } catch (error) {
        console.error("GET /api/admin/stats error:", error)
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }
}
