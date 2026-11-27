// app/admin/AdminLayout.jsx
import { redirect } from "next/navigation"
import { getAdminAuth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import AdminSidebarClientResposive from "@/components/Dashboard/AdminSidebarClientResposive"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }) {
  const admin = await getAdminAuth()
  if (!admin) {
    redirect("/admin/login")
  }

  let settings = null
  try {
    const { db } = await connectToDatabase()
    const rawSettings = await db.collection("settings").findOne({ type: "general" })
    if (rawSettings) {
      settings = JSON.parse(JSON.stringify(rawSettings))
    }
  } catch (err) {
    console.error("Failed to load admin settings:", err)
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-white">
      {/* Sidebar is client component */}
      <AdminSidebarClientResposive role={admin.role} initialSettings={settings} />

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
