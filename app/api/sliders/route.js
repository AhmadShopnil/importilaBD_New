import { connectToDatabase } from "@/lib/mongodb"
import { NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/auth"
import { getCached, setCached, clearCache } from "@/lib/cache"

export async function GET(request) {
    try {
        const cacheKey = "sliders_all"
        const cached = getCached(cacheKey)
        if (cached) return NextResponse.json(cached)

        const { db } = await connectToDatabase()
        const sliders = await db.collection("sliders")
            .find({})
            .sort({ createdAt: -1 })
            .toArray()

        setCached(cacheKey, sliders, 120)
        return NextResponse.json(sliders)
    } catch (error) {
        console.error("GET /api/sliders error:", error)
        return NextResponse.json({ error: "Failed to fetch sliders" }, { status: 500 })
    }
}

export async function POST(request) {
    const admin = await getAdminAuth()
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const data = await request.json()
        const { name, location, isActive, slides } = data

        if (!name || !location) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const { db } = await connectToDatabase()

        // Check if location already exists
        const existing = await db.collection("sliders").findOne({ location })
        if (existing) {
            return NextResponse.json({ error: "A slider with this location already exists" }, { status: 400 })
        }

        const result = await db.collection("sliders").insertOne({
            name,
            location,
            isActive: isActive ?? true,
            slides: slides ?? [],
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        clearCache("sliders_")
        return NextResponse.json({ _id: result.insertedId }, { status: 201 })
    } catch (error) {
        console.error("POST /api/sliders error:", error)
        return NextResponse.json({ error: "Failed to create slider" }, { status: 500 })
    }
}
