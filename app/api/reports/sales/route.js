import { connectToDatabase } from "@/lib/mongodb"
import { NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request) {
  const admin = await getAdminAuth()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || (searchParams.get("month") ? "month" : "30d")
    const month = searchParams.get("month") // Format: YYYY-MM

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

    // Get all orders for this month
    const allOrders = await db.collection("orders").find({
      ...matchQuery
    }).toArray()

    const isDelivered = (status) => {
      const s = String(status || "").toLowerCase().trim()
      return s === "delivered" || s === "complete" || s === "completed"
    }

    const deliveredOrders = allOrders.filter(o => isDelivered(o.status))

    // Get all products for purchase price lookup (cache them)
    const allProducts = await db.collection("products").find({}).toArray()
    const productMap = {}
    allProducts.forEach(p => {
      productMap[p._id.toString()] = p
    })

    // Group by date and calculate daily stats
    const dailyStats = {}
    let grandTotalOrders = 0
    let grandTotalDelivered = 0
    let grandTotalGross = 0
    let grandDeliveredGross = 0
    let grandTotalShipping = 0
    let grandTotalItems = 0
    let grandTotalCost = 0

    for (const order of allOrders) {
      const date = new Date(order.createdAt).toISOString().split('T')[0]
      const grossSales = Number(order.totalAmount) || Number(order.totalPrice) || 0
      const shippingCharge = Number(order.shippingCharge) || 0
      const delivered = isDelivered(order.status)

      const items = order.items || []
      let orderItemsCount = 0
      let orderCost = 0

      for (const item of items) {
        const qty = Number(item.quantity) || 1
        orderItemsCount += qty

        if (item.productId && productMap[item.productId]) {
          const pCost = Number(productMap[item.productId].purchasePrice) || 0
          orderCost += pCost * qty
        }
      }

      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          totalOrders: 0,
          deliveredOrders: 0,
          grossSales: 0,
          deliveredRevenue: 0,
          shippingCharge: 0,
          netSales: 0,
          totalItems: 0,
          totalCost: 0
        }
      }

      dailyStats[date].totalOrders++
      dailyStats[date].grossSales += grossSales
      grandTotalOrders++
      grandTotalGross += grossSales

      if (delivered) {
        dailyStats[date].deliveredOrders++
        dailyStats[date].deliveredRevenue += grossSales
        dailyStats[date].shippingCharge += shippingCharge
        dailyStats[date].netSales += (grossSales - shippingCharge)
        dailyStats[date].totalItems += orderItemsCount
        dailyStats[date].totalCost += orderCost

        grandTotalDelivered++
        grandDeliveredGross += grossSales
        grandTotalShipping += shippingCharge
        grandTotalItems += orderItemsCount
        grandTotalCost += orderCost
      }
    }

    // Convert to array and add metrics
    const sales = Object.values(dailyStats)
      .map(day => {
        const dRate = day.totalOrders > 0
          ? Number(((day.deliveredOrders / day.totalOrders) * 100).toFixed(1))
          : 0
        const aov = day.deliveredOrders > 0
          ? Math.round(day.deliveredRevenue / day.deliveredOrders)
          : (day.totalOrders > 0 ? Math.round(day.grossSales / day.totalOrders) : 0)

        return {
          ...day,
          deliveryRate: dRate,
          aov,
          netRevenue: day.netSales,
          profit: day.netSales - day.totalCost
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    const overallDeliveryRate = grandTotalOrders > 0
      ? Number(((grandTotalDelivered / grandTotalOrders) * 100).toFixed(1))
      : 0

    const overallAov = grandTotalDelivered > 0
      ? Math.round(grandDeliveredGross / grandTotalDelivered)
      : (grandTotalOrders > 0 ? Math.round(grandTotalGross / grandTotalOrders) : 0)

    // Calculate totals
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

    return NextResponse.json({
      sales,
      totals,
      month
    })
  } catch (error) {
    console.error("GET /api/reports/sales error:", error)
    return NextResponse.json({ error: "Failed to fetch sales report", details: error.message }, { status: 500 })
  }
}
