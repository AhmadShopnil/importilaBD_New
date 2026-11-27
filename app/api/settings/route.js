import { connectToDatabase } from "@/lib/mongodb"
import { NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/auth"

export async function GET() {
    // const admin = await getAdminAuth()
    // if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { db } = await connectToDatabase()

        let settings = await db.collection("settings").findOne({ type: "general" })

        // Return default settings if none exist
        if (!settings) {
            settings = {
                type: "general",
                storeName: "Kids Shop",
                storeLogo: "/logo.svg",
                storeFavicon: "",
                storeDisplayMode: "logo_only",
                dashboardName: "Admin Panel",
                dashboardLogo: "/logo.svg",
                dashboardDisplayMode: "logo_only",
                storeEmail: "",
                storePhone: "",
                storeAddress: "",
                currency: "BDT",
                currencySymbol: "৳",
                googleTagManagerId: "",
                facebookPixelId: "",
                metaTitle: "Kids Shop - Quality Kids Clothing",
                metaDescription: "Shop for quality kids clothing with fun designs",
                lowStockThreshold: 10,
                orderPrefix: "KS",
                enableGTM: false,
                enableFBPixel: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        } else {
            // Ensure defaults for branding fields if not yet present
            if (!settings.storeDisplayMode) settings.storeDisplayMode = "logo_only"
            if (!settings.dashboardDisplayMode) settings.dashboardDisplayMode = "logo_only"
            if (!settings.dashboardName) settings.dashboardName = "Admin Panel"
            if (!settings.dashboardLogo) settings.dashboardLogo = settings.storeLogo || "/logo.svg"
            if (!settings.storeName) settings.storeName = "Kids Shop"
            if (!settings.storeLogo) settings.storeLogo = "/logo.svg"
        }

        return NextResponse.json(settings)
    } catch (error) {
        console.error("GET /api/settings error:", error)
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }
}

export async function PUT(request) {
    const admin = await getAdminAuth()
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const body = await request.json()
        const { _id, type, ...updateDataWithoutId } = body
        const { db } = await connectToDatabase()

        const updateData = {
            ...updateDataWithoutId,
            type: "general", // Enforce type
            updatedAt: new Date()
        }

        const result = await db.collection("settings").updateOne(
            { type: "general" },
            { $set: updateData },
            { upsert: true }
        )

        return NextResponse.json({ success: true, result })
    } catch (error) {
        console.error("PUT /api/settings error:", error)
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }
}
