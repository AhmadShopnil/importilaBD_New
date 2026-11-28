import { connectToDatabase } from "@/lib/mongodb"
import { NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/auth"
import { getCached, setCached } from "@/lib/cache"

export async function GET(request) {
    const admin = await getAdminAuth()
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { searchParams } = new URL(request.url)
        const filter = searchParams.get("filter")
        const startDate = searchParams.get("startDate")
        const endDate = searchParams.get("endDate")
        const limit = parseInt(searchParams.get("limit") || "50")

        // Check cache first (2 min TTL)
        const cacheKey = `report_best_selling_${filter || "default"}_${startDate || ""}_${endDate || ""}_${limit}`
        const cached = getCached(cacheKey)
        if (cached) return NextResponse.json(cached)

        const { db } = await connectToDatabase()

        // 1. Define order match criteria (Strictly delivered / complete, case-insensitive)
        let orderMatch = {
            status: { $regex: /^(delivered|complete|completed)$/i }
        }

        const now = new Date()
        if (filter === "today") {
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
            orderMatch.createdAt = { $gte: startOfToday }
        } else if (filter === "yesterday") {
            const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0)
            const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
            orderMatch.createdAt = { $gte: startOfYesterday, $lte: endOfYesterday }
        } else if (filter === "7d") {
            const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            orderMatch.createdAt = { $gte: start }
        } else if (filter === "30d") {
            const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            orderMatch.createdAt = { $gte: start }
        } else if (filter === "this_month") {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
            orderMatch.createdAt = { $gte: startOfMonth }
        } else if (filter === "all") {
            // No date filter
        } else if (startDate || endDate) {
            orderMatch.createdAt = {}
            if (startDate) orderMatch.createdAt.$gte = new Date(startDate)
            if (endDate) {
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                orderMatch.createdAt.$lte = end
            }
        }

        // 2. Aggregate sales data from orders
        const [salesAggregation, overallStats] = await Promise.all([
            db.collection("orders").aggregate([
                { $match: orderMatch },
                {
                    $project: {
                        allSoldItems: {
                            $concatArrays: [
                                { $ifNull: ["$items", []] },
                                { $ifNull: ["$products", []] }
                            ]
                        }
                    }
                },
                { $unwind: "$allSoldItems" },
                {
                    $group: {
                        _id: "$allSoldItems.productId",
                        totalSold: { $sum: { $ifNull: ["$allSoldItems.quantity", 1] } },
                        totalRevenue: {
                            $sum: {
                                $multiply: [
                                    { $ifNull: ["$allSoldItems.quantity", 1] },
                                    { $convert: { input: { $ifNull: ["$allSoldItems.price", 0] }, to: "double", onError: 0, onNull: 0 } }
                                ]
                            }
                        },
                        // We sum the purchase price at the time of order if available
                        totalCost: {
                            $sum: {
                                $multiply: [
                                    { $ifNull: ["$allSoldItems.quantity", 1] },
                                    { $convert: { input: { $ifNull: ["$allSoldItems.purchasePrice", 0] }, to: "double", onError: 0, onNull: 0 } }
                                ]
                            }
                        }
                    }
                }
            ]).toArray(),
            db.collection("orders").aggregate([
                { $match: orderMatch },
                {
                    $group: {
                        _id: null,
                        totalGross: {
                            $sum: {
                                $ifNull: ["$totalAmount", { $ifNull: ["$totalPrice", { $ifNull: ["$offerPrice", { $ifNull: ["$price", 0] }] }] }]
                            }
                        },
                        totalShipping: { $sum: { $ifNull: ["$shippingCharge", 0] } }
                    }
                }
            ]).toArray()
        ])

        const statsForPeriod = overallStats[0] || { totalGross: 0, totalShipping: 0 }

        // Create a fast-lookup map for sales data
        const salesMap = {}
        salesAggregation.forEach(s => {
            if (s._id) salesMap[s._id.toString()] = s
        })

        // 3. Get all catalog products (to include 0-sale items)
        const allProducts = await db.collection("products")
            .find({ isTrashed: { $ne: true } })
            .project({ name: 1, featuredImage: 1, image: 1, purchasePrice: 1, designName: 1 })
            .toArray()

        // 4. Merge and calculate final metrics
        const report = allProducts.map(product => {
            const stats = salesMap[product._id.toString()] || { totalSold: 0, totalRevenue: 0, totalCost: 0 }

            const totalSold = stats.totalSold
            const totalRevenue = stats.totalRevenue

            // If order cost is 0, use current catalog purchase price as fallback
            let totalCost = stats.totalCost
            if (totalCost === 0 && totalSold > 0) {
                totalCost = totalSold * parseFloat(product.purchasePrice || 0)
            }

            const totalProfit = totalRevenue - totalCost

            return {
                _id: product._id,
                name: product.name,
                designName: product.designName,
                image: product.featuredImage || product.image,
                totalSold,
                totalRevenue,
                totalProfit
            }
        })

        // 5. Sort by Quantity Sold (Descending)
        report.sort((a, b) => b.totalSold - a.totalSold)

        // Trim to requested limit (default 100)
        const finalReport = report.slice(0, limit)

        const result = {
            report: finalReport,
            stats: {
                totalGross: statsForPeriod.totalGross,
                totalShipping: statsForPeriod.totalShipping,
                totalNet: statsForPeriod.totalGross - statsForPeriod.totalShipping
            }
        }
        setCached(cacheKey, result, 120)
        return NextResponse.json(result)
    } catch (error) {
        console.error("GET /api/reports/best-selling error:", error)
        return NextResponse.json({ error: "Failed to fetch best selling report" }, { status: 500 })
    }
}
