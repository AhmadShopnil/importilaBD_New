"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DollarSign, Archive, FileText, RefreshCcw, Truck, CheckCircle2, Clock, AlertTriangle, ExternalLink } from "lucide-react"
import Loading from "@/components/Loader/Loading"
import { BASE_URL } from "@/utils/baseUrl"

export default function CourierReportsPage() {
    const [balance, setBalance] = useState(null)
    const [payments, setPayments] = useState([])
    const [returns, setReturns] = useState([])
    const [localStats, setLocalStats] = useState(null)
    const [notConfigured, setNotConfigured] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAllReports()
    }, [])

    const fetchAllReports = async () => {
        setLoading(true)
        try {
            const [balanceRes, paymentsRes, returnsRes] = await Promise.all([
                fetch(`${BASE_URL}/api/courier/report?type=balance`).then(r => r.json()).catch(() => ({})),
                fetch(`${BASE_URL}/api/courier/report?type=payments`).then(r => r.json()).catch(() => ({})),
                fetch(`${BASE_URL}/api/courier/report?type=returns`).then(r => r.json()).catch(() => ({}))
            ])

            if (balanceRes.localCourierStats) {
                setLocalStats(balanceRes.localCourierStats)
            }
            if (balanceRes.notConfigured) {
                setNotConfigured(true)
            }

            setBalance(balanceRes.current_balance !== undefined ? balanceRes.current_balance : null)
            setPayments(paymentsRes.data || paymentsRes || [])
            setReturns(returnsRes.data || returnsRes || [])
        } catch (error) {
            console.error("Failed to fetch courier reports:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <Loading />

    const totalDispatched = localStats?.totalDispatched || 0
    const deliveredCount = localStats?.deliveredCount || 0
    const inTransitCount = localStats?.inTransitCount || 0
    const returnedCount = localStats?.returnedCount || 0
    const deliveryRate = localStats?.deliveryRate || 0
    const codCollected = localStats?.totalCodCollected || 0
    const recentShipments = localStats?.recentShipments || []

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#1E556E]">Courier Performance & Settlement</h1>
                    <p className="text-muted-foreground text-xs sm:text-sm">Steadfast delivery rates, in-transit parcels, and COD cash reconciliation</p>
                </div>
                <button
                    onClick={fetchAllReports}
                    className="p-2 bg-white border border-border rounded-lg shadow-xs hover:bg-gray-50 text-[#1E556E] flex items-center gap-2 text-xs font-semibold"
                    title="Refresh Data"
                >
                    <RefreshCcw className="w-4 h-4" />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Reports Sub-Navigation Hub */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Sales Report", href: "/admin/reports", active: false },
                    { label: "Best Selling", href: "/admin/reports/best-selling", active: false },
                    { label: "Channel Analysis", href: "/admin/reports/sources", active: false },
                    { label: "Courier Report", href: "/admin/reports/courier", active: true }
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

            {/* Notice if Steadfast API not configured */}
            {notConfigured && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Steadfast API credentials are not yet configured for live wallet balance and automated consignment booking. Internal courier metrics from your orders are shown below.</span>
                    </div>
                    <Link href="/admin/settings/courier" className="font-bold underline ml-2 shrink-0 text-[#1E556E]">
                        Configure API
                    </Link>
                </div>
            )}

            {/* Courier Performance KPIs (From Store Orders) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-border shadow-xs">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">COD Collected</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">৳ {codCollected.toLocaleString()}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">From {deliveredCount} delivered parcels</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-border shadow-xs">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Courier Success %</span>
                    </div>
                    <p className={`text-2xl font-bold ${Number(deliveryRate) >= 75 ? "text-emerald-600" : "text-amber-600"}`}>
                        {deliveryRate}%
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">{deliveredCount} delivered / {totalDispatched} dispatched</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-border shadow-xs">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Truck className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">In Transit / Active</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{inTransitCount}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Currently with delivery riders</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-border shadow-xs">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                            <Archive className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Return to Origin (RTO)</span>
                    </div>
                    <p className="text-2xl font-bold text-rose-600">{returnedCount}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Returned by customers</p>
                </div>
            </div>

            {/* Recent Consignments / Shipments Table */}
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Recent Courier Consignments</h2>
                        <p className="text-xs text-muted-foreground">Orders dispatched with courier tracking codes and COD amounts</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-500">{recentShipments.length} parcels</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/40 border-b border-border text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="px-5 py-3.5 text-left">Order & Tracking</th>
                                <th className="px-5 py-3.5 text-left">Customer</th>
                                <th className="px-5 py-3.5 text-left">Destination</th>
                                <th className="px-5 py-3.5 text-right">COD Amount</th>
                                <th className="px-5 py-3.5 text-center">Status</th>
                                <th className="px-5 py-3.5 text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {recentShipments.map((ship, idx) => (
                                <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="font-semibold text-gray-900">{ship.orderNumber}</div>
                                        <div className="text-xs text-indigo-600 font-mono flex items-center gap-1">
                                            <span>{ship.trackingCode}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="font-medium text-gray-900">{ship.customerName}</div>
                                        <div className="text-xs text-muted-foreground">{ship.phone}</div>
                                    </td>
                                    <td className="px-5 py-3.5 font-medium text-gray-700">{ship.city}</td>
                                    <td className="px-5 py-3.5 text-right font-bold text-gray-900">
                                        ৳ {Number(ship.amount).toLocaleString()}
                                    </td>
                                    <td className="px-5 py-3.5 text-center">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${
                                            ship.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                                            ship.status === 'shipped' || ship.status === 'in-transit' ? 'bg-blue-100 text-blue-800' :
                                            ship.status === 'returned' ? 'bg-rose-100 text-rose-800' :
                                            'bg-amber-100 text-amber-800'
                                        }`}>
                                            {ship.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right text-xs text-muted-foreground">
                                        {ship.createdAt ? new Date(ship.createdAt).toLocaleDateString() : "N/A"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {recentShipments.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                            No shipments assigned to courier yet
                        </div>
                    )}
                </div>
            </div>

            {/* Steadfast Remote API Wallet Section (if configured) */}
            {!notConfigured && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-xl border border-border shadow-xs">
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                            Steadfast Wallet Balance
                        </h3>
                        <p className="text-3xl font-extrabold text-emerald-700">৳ {balance !== null ? balance : "0"}</p>
                        <p className="text-xs text-muted-foreground mt-1">Available for payout from Steadfast Courier</p>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-border shadow-xs">
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            Recent Steadfast Payouts
                        </h3>
                        <p className="text-3xl font-extrabold text-blue-700">{payments.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">Disbursements processed to your bank/MFS</p>
                    </div>
                </div>
            )}
        </div>
    )
}
