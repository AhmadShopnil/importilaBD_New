"use client"

import { useEffect, useState } from "react"
import { Calendar, PieChart, TrendingUp, ShoppingBag, DollarSign, CheckCircle2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { BASE_URL } from "@/utils/baseUrl"
import Loading from "@/components/Loader/Loading"

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

export default function SourceAnalysisPage() {
    const [stats, setStats] = useState([])
    const [filter, setFilter] = useState("30d")
    const [loading, setLoading] = useState(true)
    const [monthYear, setMonthYear] = useState(new Date().toISOString().slice(0, 7))

    useEffect(() => {
        fetchSourceReport()
    }, [filter, monthYear])

    const fetchSourceReport = async () => {
        try {
            const query = filter === "month" ? `filter=month&month=${monthYear}` : `filter=${filter}`
            const res = await fetch(`${BASE_URL}/api/reports/sources?${query}`)
            const data = await res.json()
            setStats(data.sourceStats || [])
        } catch (error) {
            console.error("Failed to fetch source report:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <Loading />

    const totalRevenue = stats.reduce((sum, item) => sum + (item.deliveredRevenue || item.totalRevenue || 0), 0)
    const totalGross = stats.reduce((sum, item) => sum + (item.grossRevenue || 0), 0)
    const totalOrders = stats.reduce((sum, item) => sum + item.totalOrders, 0)
    const totalDelivered = stats.reduce((sum, item) => sum + (item.deliveredOrders || 0), 0)
    const overallDeliveryRate = totalOrders > 0 ? ((totalDelivered / totalOrders) * 100).toFixed(1) : 0
    const overallAov = totalDelivered > 0 ? Math.round(totalRevenue / totalDelivered) : 0

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/reports" className="p-2 hover:bg-muted rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-[#1E556E]" />
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#1E556E]">Marketing Channel Analysis</h1>
                        <p className="text-muted-foreground text-xs sm:text-sm">Track customer acquisition channels, delivery performance, and revenue attribution</p>
                    </div>
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

            {/* Growth & Marketing Decision KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-border shadow-xs">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Delivered Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">৳ {totalRevenue.toLocaleString()}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Gross Placed: ৳ {totalGross.toLocaleString()}</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-border shadow-xs">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Orders</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                    <p className="text-[11px] text-emerald-600 font-medium mt-1">{totalDelivered} Delivered successfully</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-border shadow-xs">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Delivery Rate</span>
                    </div>
                    <p className={`text-2xl font-bold ${Number(overallDeliveryRate) >= 75 ? "text-emerald-600" : Number(overallDeliveryRate) >= 60 ? "text-amber-600" : "text-rose-600"}`}>
                        {overallDeliveryRate}%
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">COD Success Benchmark: &gt;75%</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-border shadow-xs">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Blended AOV</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">৳ {overallAov.toLocaleString()}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Average order value across channels</p>
                </div>
            </div>

            {/* Source Breakdown Table */}
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-[#1E556E]" />
                        <h2 className="text-lg font-bold">Marketing Channel Attribution Table</h2>
                    </div>
                    <span className="text-xs text-muted-foreground">Showing performance for {monthYear}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40 border-b border-border text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="px-5 py-3.5 text-left">Channel / Source</th>
                                <th className="px-5 py-3.5 text-center">Total Orders</th>
                                <th className="px-5 py-3.5 text-center">Delivered</th>
                                <th className="px-5 py-3.5 text-center">Delivery Success %</th>
                                <th className="px-5 py-3.5 text-right">Delivered Revenue</th>
                                <th className="px-5 py-3.5 text-right">Channel AOV</th>
                                <th className="px-5 py-3.5 text-left min-w-[150px]">Revenue Share</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {stats.map((item, idx) => {
                                const rev = item.deliveredRevenue || item.totalRevenue || 0
                                const percentage = totalRevenue > 0 ? (rev / totalRevenue) * 100 : 0
                                const dRate = Number(item.deliveryRate || 0)

                                return (
                                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${sourceDotColors[item.source] || "bg-gray-400"}`} />
                                                <span className="capitalize font-semibold text-gray-900">{item.source || "Website"}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center font-medium">{item.totalOrders}</td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                {item.deliveredOrders || 0}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                dRate >= 75 ? "bg-emerald-100 text-emerald-800" :
                                                dRate >= 60 ? "bg-amber-100 text-amber-800" :
                                                "bg-rose-100 text-rose-800"
                                            }`}>
                                                {dRate}%
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right font-bold text-gray-900">
                                            ৳ {rev.toLocaleString()}
                                        </td>
                                        <td className="px-5 py-4 text-right font-medium text-gray-600">
                                            ৳ {(item.aov || 0).toLocaleString()}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-muted rounded-full h-2">
                                                    <div
                                                        className={`h-full rounded-full ${sourceDotColors[item.source] || "bg-gray-400"}`}
                                                        style={{ width: `${Math.min(100, Math.max(2, percentage))}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold w-12 text-right">{percentage.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    {stats.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No order channel data found for {monthYear}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
