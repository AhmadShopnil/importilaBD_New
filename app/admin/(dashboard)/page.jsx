"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  ChartNoAxesCombined,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  ArrowUpRight,
  BarChart3,
  Flame,
  Globe
} from "lucide-react"
import DailyOrdersChart from "@/components/Dashboard/Report/DailyOrdersChart"
import MonthlyOrdersCompareChart from "@/components/Dashboard/Report/MonthlyOrdersCompareChart"
import WebOrderReportChart from "@/components/Dashboard/Report/WebOrderReportChart"
import { useGetDashboardStatsQuery } from "@/lib/redux/api/dashboardApi"
import DashboardSkeleton from "@/components/Dashboard/DashboardSkeleton"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const YEARS = [2024, 2025, 2026]

const sourceDotColors = {
  website: "bg-blue-500",
  facebook: "bg-indigo-600",
  whatsapp: "bg-emerald-500",
  call: "bg-amber-500",
  instagram: "bg-pink-500",
  tiktok: "bg-slate-900",
  wholesale: "bg-purple-500",
  manual: "bg-orange-500",
  other: "bg-gray-400",
}

export default function AdminDashboard() {
  const [filter, setFilter] = useState("all")
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  const { data: stats = {
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    inTransitOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    returnedOrders: 0,
    grossSales: 0,
    deliveredSales: 0,
    netSales: 0,
    netProductSales: 0,
    shippingCollected: 0,
    totalDiscount: 0,
    aov: 0,
    deliveryRate: 0,
    returnRate: 0,
    cancellationRate: 0,
    lowStockItems: 0,
    statusDistribution: [],
    sourceDistribution: [],
    topProducts: []
  }, isLoading: loading } = useGetDashboardStatsQuery({ filter, month, year })

  if (loading) {
    return <DashboardSkeleton />
  }

  const deliveryRate = Number(stats.deliveryRate || 0)
  const deliveredSales = stats.deliveredSales || stats.totalSales || 0
  const grossSales = stats.grossSales || deliveredSales
  const totalOrders = stats.totalOrders || 0
  const deliveredOrders = stats.deliveredOrders || 0
  const aov = stats.aov || (deliveredOrders > 0 ? Math.round(deliveredSales / deliveredOrders) : 0)

  const statCards = [
    {
      label: "Delivered Net Revenue",
      value: `৳${deliveredSales.toLocaleString()}`,
      subtext: `Gross Placed: ৳${grossSales.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-emerald-50 text-emerald-600",
      cardStyle: "border border-emerald-200 bg-white"
    },
    {
      label: "Delivered Orders",
      value: deliveredOrders,
      subtext: `${totalOrders} total placed`,
      icon: ShoppingCart,
      color: "bg-blue-50 text-blue-600",
      cardStyle: "border border-blue-200 bg-white"
    },
    {
      label: "Delivery Success Rate",
      value: `${deliveryRate}%`,
      subtext: deliveryRate >= 75 ? "Healthy (>75% target)" : "Needs attention (<75%)",
      icon: CheckCircle2,
      color: deliveryRate >= 75 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600",
      cardStyle: deliveryRate >= 75 ? "border border-emerald-200 bg-white" : "border border-amber-200 bg-white"
    },
    {
      label: "Average Order Value (AOV)",
      value: `৳${aov.toLocaleString()}`,
      subtext: "Delivered package avg",
      icon: TrendingUp,
      color: "bg-purple-50 text-purple-600",
      cardStyle: "border border-purple-200 bg-white"
    },
    {
      label: "Pending Web Orders",
      value: stats.pendingOrders || 0,
      subtext: "Needs call verification",
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
      cardStyle: "border border-amber-200 bg-white"
    },
    {
      label: "In Transit / Dispatched",
      value: (stats.inTransitOrders || 0) + (stats.confirmedOrders || 0),
      subtext: "Active in courier/processing",
      icon: Truck,
      color: "bg-sky-50 text-sky-600",
      cardStyle: "border border-sky-200 bg-white"
    },
    {
      label: "Customer Shipping Fee",
      value: `৳${(stats.shippingCollected || stats.totalShippingSpent || 0).toLocaleString()}`,
      subtext: "Shipping collected",
      icon: ChartNoAxesCombined,
      color: "bg-teal-50 text-teal-600",
      cardStyle: "border border-teal-200 bg-white"
    },
    {
      label: "Low Stock Alert",
      value: stats.lowStockItems || 0,
      subtext: `${stats.totalProducts || 0} active products`,
      icon: AlertTriangle,
      color: "bg-rose-50 text-rose-600",
      cardStyle: "border border-rose-200 bg-white"
    },
  ]

  return (
    <div className="bg-gray-50/50 min-h-screen space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 font-medium">Real-time revenue, order fulfillment, and marketing metrics</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main Filter Tabs */}
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

          {/* Month/Year Selection */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setFilter("month")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filter === "month"
                  ? "bg-[#1E556E] text-white shadow-xs font-bold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Month
            </button>

            {filter === "month" && (
              <div className="flex gap-1.5">
                <select
                  value={month}
                  onChange={(e) => {
                    setMonth(Number(e.target.value))
                    setFilter("month")
                  }}
                  className="bg-white border border-gray-200 text-xs font-bold rounded-lg px-2.5 py-1 text-gray-700 outline-none cursor-pointer"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={year}
                  onChange={(e) => {
                    setYear(Number(e.target.value))
                    setFilter("month")
                  }}
                  className="bg-white border border-gray-200 text-xs font-bold rounded-lg px-2.5 py-1 text-gray-700 outline-none cursor-pointer"
                >
                  {YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Growth Reports Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Sales & Daily Report", desc: "Delivered breakdown & totals", href: "/admin/reports", icon: DollarSign },
          { label: "Best-Selling Products", desc: "Top volume & hero items", href: "/admin/reports/best-selling", icon: Flame },
          { label: "Channel Attribution", desc: "Facebook, Website, WhatsApp", href: "/admin/reports/sources", icon: Globe },
          { label: "Courier Performance", desc: "Steadfast payments & RTO", href: "/admin/reports/courier", icon: Truck }
        ].map((item, i) => {
          const Icon = item.icon
          return (
            <Link
              key={i}
              href={item.href}
              className="bg-white p-3.5 rounded-xl border border-border shadow-xs hover:border-[#1E556E] hover:shadow-sm transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#1E556E]/10 text-[#1E556E] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 group-hover:text-[#1E556E] transition-colors">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[#1E556E] transition-colors shrink-0" />
            </Link>
          )
        })}
      </div>

      {/* 8 Primary Decision KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className={`rounded-xl ${card.cardStyle} p-5 shadow-xs hover:shadow-sm transition-all`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{card.label}</span>
                <div className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium">{card.subtext}</p>
            </div>
          )
        })}
      </div>

      {/* Order Fulfillment Pipeline Progress Bar */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
          <span>Order Fulfillment Pipeline Status</span>
          <span className="text-xs font-medium text-muted-foreground">Total: {totalOrders} orders</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Pending", count: stats.pendingOrders || 0, color: "bg-amber-100 text-amber-800 border-amber-200" },
            { label: "Confirmed", count: stats.confirmedOrders || 0, color: "bg-blue-100 text-blue-800 border-blue-200" },
            { label: "In Transit", count: stats.inTransitOrders || 0, color: "bg-sky-100 text-sky-800 border-sky-200" },
            { label: "Delivered", count: deliveredOrders, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
            { label: "Returned/Cancelled", count: (stats.returnedOrders || 0) + (stats.cancelledOrders || 0), color: "bg-rose-100 text-rose-800 border-rose-200" },
          ].map((step, idx) => (
            <div key={idx} className={`p-3 rounded-lg border text-center ${step.color}`}>
              <p className="text-[11px] font-bold uppercase tracking-wider">{step.label}</p>
              <p className="text-xl font-extrabold mt-1">{step.count}</p>
              <p className="text-[10px] opacity-80 mt-0.5">
                {totalOrders > 0 ? `${Math.round((step.count / totalOrders) * 100)}%` : "0%"} of orders
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Marketing Channels & Top Hero Products */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Marketing Attribution Table */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#1E556E]" />
                  Channel Attribution & Delivery Rate
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Which acquisition channels bring profitable delivered revenue</p>
              </div>
              <Link href="/admin/reports/sources" className="text-xs font-bold text-[#1E556E] hover:underline">
                View Details
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-3 py-2 text-left">Channel</th>
                    <th className="px-3 py-2 text-center">Orders</th>
                    <th className="px-3 py-2 text-center">Delivered</th>
                    <th className="px-3 py-2 text-center">Success Rate</th>
                    <th className="px-3 py-2 text-right">Delivered Rev</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(stats.sourceDistribution || []).map((src, i) => {
                    const rev = src.deliveredRevenue || 0
                    const dRate = Number(src.deliveryRate || 0)
                    return (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="px-3 py-2.5 font-semibold capitalize text-gray-900 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${sourceDotColors[src._id] || "bg-gray-400"}`} />
                          {src._id}
                        </td>
                        <td className="px-3 py-2.5 text-center font-medium">{src.count}</td>
                        <td className="px-3 py-2.5 text-center font-bold text-emerald-700">{src.deliveredOrders || 0}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            dRate >= 75 ? "bg-emerald-100 text-emerald-800" :
                            dRate >= 60 ? "bg-amber-100 text-amber-800" :
                            "bg-rose-100 text-rose-800"
                          }`}>
                            {dRate}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-gray-900">
                          ৳{rev.toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {(!stats.sourceDistribution || stats.sourceDistribution.length === 0) && (
                <div className="py-8 text-center text-muted-foreground text-xs">
                  No channel orders found for this period
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Hero Products */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-600" />
                  Top Hero Products (Campaign Focus)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Top revenue and volume drivers for ad targeting</p>
              </div>
              <Link href="/admin/reports/best-selling" className="text-xs font-bold text-[#1E556E] hover:underline">
                Full Report
              </Link>
            </div>

            <div className="space-y-3">
              {(stats.topProducts || []).slice(0, 5).map((prod, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden mr-2">
                    <div className="w-10 h-10 rounded-md bg-white border border-border flex items-center justify-center p-1 overflow-hidden shrink-0">
                      {prod.image ? (
                        <img src={prod.image} alt={prod.title} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <Package className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-gray-900 truncate">{prod.title || "Product"}</p>
                      <p className="text-[11px] text-muted-foreground">{prod.quantity} units sold</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-emerald-700">৳{(prod.revenue || 0).toLocaleString()}</p>
                    <span className="text-[10px] text-muted-foreground font-medium">Delivered: {prod.deliveredQuantity || prod.quantity}</span>
                  </div>
                </div>
              ))}

              {(!stats.topProducts || stats.topProducts.length === 0) && (
                <div className="py-8 text-center text-muted-foreground text-xs">
                  No product sales recorded in this period
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Pie Charts for Status & Source */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <WebOrderReportChart
          title={"Order Status Distribution"}
          data={stats.statusDistribution}
          totalOrders={totalOrders}
          currentFilter={filter}
          currentMonth={month}
          currentYear={year}
          onFilterChange={setFilter}
          onMonthChange={setMonth}
          onYearChange={setYear}
        />

        <WebOrderReportChart
          title={"Order Acquisition Sources"}
          data={stats.sourceDistribution}
          totalOrders={deliveredOrders}
          currentFilter={filter}
          currentMonth={month}
          currentYear={year}
          onFilterChange={setFilter}
          onMonthChange={setMonth}
          onYearChange={setYear}
        />
      </div>

      {/* Interactive Trend Charts */}
      <div className="grid grid-cols-1 gap-6">
        <DailyOrdersChart month={month} year={year} />
        <MonthlyOrdersCompareChart year={year} />
      </div>
    </div>
  )
}
