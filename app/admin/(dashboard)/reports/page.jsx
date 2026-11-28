"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, TrendingUp, DollarSign, Package, Truck, ChartNoAxesCombined, CheckCircle2, ArrowRight } from "lucide-react"
import { BASE_URL } from "@/utils/baseUrl"

export default function ReportsPage() {
  const [sales, setSales] = useState([])
  const [filter, setFilter] = useState("30d")
  const [totals, setTotals] = useState({
    totalOrders: 0,
    deliveredOrders: 0,
    deliveryRate: 0,
    totalGross: 0,
    deliveredRevenue: 0,
    totalNet: 0,
    totalShipping: 0,
    totalProfit: 0,
    totalItems: 0,
    avgOrderValue: 0
  })
  const [loading, setLoading] = useState(true)
  const [monthYear, setMonthYear] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => {
    fetchSalesReport()
  }, [filter, monthYear])

  const fetchSalesReport = async () => {
    setLoading(true)
    try {
      const query = filter === "month" ? `filter=month&month=${monthYear}` : `filter=${filter}`
      const res = await fetch(`${BASE_URL}/api/reports/sales?${query}`)
      const data = await res.json()
      setSales(data.sales || [])
      setTotals(data.totals || {
        totalOrders: 0,
        deliveredOrders: 0,
        deliveryRate: 0,
        totalGross: 0,
        deliveredRevenue: 0,
        totalNet: 0,
        totalShipping: 0,
        totalProfit: 0,
        totalItems: 0,
        avgOrderValue: 0
      })
    } catch (error) {
      console.error("Failed to fetch sales report:", error)
    } finally {
      setLoading(false)
    }
  }

  const avgOrderValue = totals.avgOrderValue || (totals.deliveredOrders > 0 ? Math.round(totals.deliveredRevenue / totals.deliveredOrders) : 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E556E]">Sales & Revenue Report</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">Delivered orders, delivery performance, and revenue analytics</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "7d", label: "7D" },
              { id: "30d", label: "30D" },
              { id: "this_month", label: "This Month" },
              { id: "all", label: "All Time" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filter === tab.id
                    ? "bg-[#1E556E] text-white shadow-xs font-bold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setFilter("month")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "month"
                ? "bg-[#1E556E] text-white shadow-xs font-bold"
                : "bg-gray-100 text-gray-600 hover:text-gray-900"
            }`}
          >
            Month
          </button>

          {filter === "month" && (
            <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-1.5 shadow-xs">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <input
                type="month"
                value={monthYear}
                onChange={(e) => {
                  setMonthYear(e.target.value)
                  setFilter("month")
                }}
                className="bg-transparent text-foreground focus:outline-none font-medium text-xs sm:text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Reports Sub-Navigation Hub */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Sales Report", href: "/admin/reports", active: true },
          { label: "Best Selling", href: "/admin/reports/best-selling", active: false },
          { label: "Channel Analysis", href: "/admin/reports/sources", active: false },
          { label: "Courier Report", href: "/admin/reports/courier", active: false }
        ].map((tab, i) => (
          <Link
            key={i}
            href={tab.href}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold text-center border transition-all ${
              tab.active
                ? "bg-[#1E556E] text-white border-[#1E556E] shadow-xs"
                : "bg-white text-gray-700 border-border hover:bg-muted/50 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Summary Decision Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Delivered Orders</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totals.deliveredOrders}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Out of {totals.totalOrders || totals.deliveredOrders} total placed
          </p>
        </div>

        <div className="bg-white border border-border rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Delivered Revenue</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">৳ {totals.deliveredRevenue?.toLocaleString() || totals.totalGross?.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Gross Placed: ৳ {totals.totalGross?.toLocaleString()}
          </p>
        </div>

        <div className="bg-white border border-border rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Delivery Rate</span>
          </div>
          <p className={`text-2xl font-bold ${Number(totals.deliveryRate) >= 75 ? "text-emerald-600" : Number(totals.deliveryRate) >= 60 ? "text-amber-600" : "text-rose-600"}`}>
            {totals.deliveryRate || 0}%
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Shipping Collected: ৳ {(totals.totalShipping || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white border border-border rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Avg Order Value (AOV)</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">৳ {avgOrderValue.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Average per delivered package</p>
        </div>
      </div>

      {/* Daily Sales Table */}
      <div className="overflow-x-auto bg-white rounded-xl border border-border shadow-xs">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-bold text-base flex items-center gap-2 text-gray-900">
              <Calendar className="w-4 h-4 text-[#1E556E]" />
              Daily Sales & Delivery Breakdown
            </h2>
            <p className="text-xs text-muted-foreground">Detailed daily breakdown for {monthYear}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#1E556E] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border uppercase text-xs">
              <tr>
                <th className="px-5 py-3.5 text-left font-bold">Date</th>
                <th className="px-5 py-3.5 text-center font-bold">Orders Placed</th>
                <th className="px-5 py-3.5 text-center font-bold">Delivered</th>
                <th className="px-5 py-3.5 text-center font-bold">Delivery %</th>
                <th className="px-5 py-3.5 text-right font-bold text-blue-700">Delivered Revenue</th>
                <th className="px-5 py-3.5 text-right font-bold text-gray-600 hidden md:table-cell">Shipping</th>
                <th className="px-5 py-3.5 text-right font-bold text-purple-700 hidden lg:table-cell">AOV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales
                .filter(day => (day.totalOrders > 0 || day.deliveredOrders > 0))
                .slice()
                .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
                .map((day, idx) => (
                <tr key={idx} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-gray-900">
                    {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-5 py-3.5 text-center font-medium text-gray-700">
                    {day.totalOrders || day.deliveredOrders}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                      {day.deliveredOrders}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      Number(day.deliveryRate) >= 75 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      Number(day.deliveryRate) >= 60 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}>
                      {day.deliveryRate || 0}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-blue-700">
                    ৳ {(day.deliveredRevenue || day.grossSales)?.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right text-gray-600 hidden md:table-cell">
                    ৳ {(day.shippingCharge || 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right text-purple-700 font-medium hidden lg:table-cell">
                    ৳ {(day.aov || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            {sales.filter(day => (day.totalOrders > 0 || day.deliveredOrders > 0)).length > 0 && (
              <tfoot className="bg-muted/50 border-t-2 border-border font-bold">
                <tr>
                  <td className="px-5 py-3.5 text-[#1E556E]">MONTH TOTAL</td>
                  <td className="px-5 py-3.5 text-center">{totals.totalOrders || totals.deliveredOrders}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                      {totals.deliveredOrders}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center text-xs font-bold">{totals.deliveryRate}%</td>
                  <td className="px-5 py-3.5 text-right text-blue-700">৳ {totals.deliveredRevenue?.toLocaleString() || totals.totalGross?.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right text-gray-600 hidden md:table-cell">৳ {(totals.totalShipping || 0).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right text-purple-700 hidden lg:table-cell">৳ {avgOrderValue.toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      {!loading && sales.filter(day => (day.totalOrders > 0 || day.deliveredOrders > 0)).length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-border">
          <Truck className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-semibold">No order activity found for {monthYear}</p>
          <p className="text-xs text-muted-foreground mt-1">Try selecting a different month</p>
        </div>
      )}
    </div>
  )
}
