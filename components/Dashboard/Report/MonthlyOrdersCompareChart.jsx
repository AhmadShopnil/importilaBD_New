"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line
} from "recharts"
import { BASE_URL } from "@/utils/baseUrl"

const YEARS = [2024, 2025, 2026]

export default function MonthlyOrdersCompareChart({ year: propYear }) {
  const [year, setYear] = useState(propYear || new Date().getFullYear())
  const [data, setData] = useState([])
  const [metricView, setMetricView] = useState("both") // "both" | "revenue" | "orders"

  useEffect(() => {
    if (propYear) setYear(propYear)
  }, [propYear])

  useEffect(() => {
    fetch(`${BASE_URL}/api/orders/daily-by-month?view=yearly&year=${year}`)
      .then(res => res.ok ? res.json() : [])
      .then(setData)
      .catch(() => setData([]))
  }, [year])

  const totalYearRevenue = data.reduce((sum, m) => sum + (m.deliveredRevenue || 0), 0)
  const totalYearOrders = data.reduce((sum, m) => sum + (m.deliveredOrders || 0), 0)

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900">
            {year} Monthly Growth & Seasonality Overview
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Year-to-Date Delivered Revenue: <span className="font-bold text-emerald-600">৳{totalYearRevenue.toLocaleString()}</span> | Delivered Orders: <span className="font-bold text-indigo-600">{totalYearOrders}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-semibold">
            {[
              { id: "both", label: "Dual View" },
              { id: "revenue", label: "Revenue (৳)" },
              { id: "orders", label: "Orders" },
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setMetricView(btn.id)}
                className={`px-2.5 py-1.5 rounded-md transition-all ${
                  metricView === btn.id
                    ? "bg-white text-gray-900 shadow-xs font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-border text-xs font-bold rounded-lg px-3 py-1.5 bg-gray-50 text-gray-800 outline-none cursor-pointer"
          >
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />

            {(metricView === "both" || metricView === "orders") && (
              <YAxis
                yAxisId="orders"
                orientation="left"
                tick={{ fontSize: 11, fill: '#6366f1' }}
                allowDecimals={false}
                stroke="#6366f1"
              />
            )}

            {(metricView === "both" || metricView === "revenue") && (
              <YAxis
                yAxisId="revenue"
                orientation={metricView === "both" ? "right" : "left"}
                tick={{ fontSize: 11, fill: '#059669' }}
                tickFormatter={(val) => `৳${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                stroke="#059669"
              />
            )}

            <Tooltip
              formatter={(value, name) => {
                if (String(name).includes("Revenue")) return [`৳${Number(value).toLocaleString()}`, name]
                return [value, name]
              }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

            {(metricView === "both" || metricView === "revenue") && (
              <Bar
                yAxisId="revenue"
                dataKey="deliveredRevenue"
                fill="#059669"
                radius={[4, 4, 0, 0]}
                name="Delivered Revenue (৳)"
              />
            )}

            {(metricView === "both" || metricView === "orders") && (
              <Bar
                yAxisId="orders"
                dataKey="deliveredOrders"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                name="Delivered Orders"
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
