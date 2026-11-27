"use client"

import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"
import { BASE_URL } from "@/utils/baseUrl"

const MONTHS_LIST = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export default function DailyOrdersChart({ month, year }) {
  const [data, setData] = useState([])
  const [viewMode, setViewMode] = useState("both") // "both" | "revenue" | "orders"

  useEffect(() => {
    const queryParams = new URLSearchParams()
    if (month) queryParams.append("month", month)
    if (year) queryParams.append("year", year)

    fetch(`${BASE_URL}/api/orders/monthly?${queryParams.toString()}`)
      .then(res => res.ok ? res.json() : [])
      .then(setData)
      .catch(() => setData([]))
  }, [month, year])

  const totalDeliveredRevenue = data.reduce((sum, d) => sum + (d.deliveredRevenue || 0), 0)
  const totalDeliveredOrders = data.reduce((sum, d) => sum + (d.deliveredOrders || 0), 0)
  const totalOrders = data.reduce((sum, d) => sum + (d.orders || 0), 0)

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900">
            {month && year ? `${MONTHS_LIST[month - 1]} ${year}` : 'Current Month'} Performance Trend
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total Orders: <span className="font-bold text-gray-800">{totalOrders}</span> | Delivered: <span className="font-bold text-emerald-600">{totalDeliveredOrders}</span> | Delivered Rev: <span className="font-bold text-blue-600">৳{totalDeliveredRevenue.toLocaleString()}</span>
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-lg self-start sm:self-auto text-xs font-semibold">
          {[
            { id: "both", label: "Dual Axis" },
            { id: "revenue", label: "Revenue (৳)" },
            { id: "orders", label: "Orders" },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setViewMode(btn.id)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === btn.id
                  ? "bg-white text-gray-900 shadow-xs font-bold"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="day"
              tickFormatter={(d) => `${d}`}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />

            {/* Left Y-Axis for Orders */}
            {(viewMode === "both" || viewMode === "orders") && (
              <YAxis
                yAxisId="orders"
                orientation="left"
                tick={{ fontSize: 11, fill: '#6366f1' }}
                allowDecimals={false}
                stroke="#6366f1"
              />
            )}

            {/* Right Y-Axis for Revenue */}
            {(viewMode === "both" || viewMode === "revenue") && (
              <YAxis
                yAxisId="revenue"
                orientation={viewMode === "both" ? "right" : "left"}
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

            {/* Orders Lines */}
            {(viewMode === "both" || viewMode === "orders") && (
              <>
                <Line
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  name="Orders Placed"
                  dot={false}
                />
                <Line
                  yAxisId="orders"
                  type="monotone"
                  dataKey="deliveredOrders"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  name="Delivered Orders"
                />
              </>
            )}

            {/* Revenue Lines */}
            {(viewMode === "both" || viewMode === "revenue") && (
              <>
                <Line
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                  name="Gross Placed (৳)"
                  dot={false}
                />
                <Line
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="deliveredRevenue"
                  stroke="#059669"
                  strokeWidth={2.5}
                  name="Delivered Revenue (৳)"
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
