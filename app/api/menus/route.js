import { connectToDatabase } from "@/lib/mongodb"
import { NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/auth"
import { ObjectId } from "mongodb"

const INITIAL_MENUS = [
  {
    title: "Main Navigation",
    slug: "main-menu",
    location: "header",
    isActive: true,
    items: [
      {
        id: "nav-1",
        label: "Home",
        url: "/",
        badge: "",
        openInNewTab: false,
        children: [],
      },
      {
        id: "nav-2",
        label: "Shop",
        url: "/shop",
        badge: "",
        openInNewTab: false,
        children: [],
      },
      {
        id: "nav-3",
        label: "Combos",
        url: "/combo",
        badge: "Hot",
        openInNewTab: false,
        children: [],
      },
    ],
  },
  {
    title: "Footer Links",
    slug: "footer-menu",
    location: "footer",
    isActive: true,
    items: [
      {
        id: "f-1",
        label: "Shop",
        url: "/shop",
        badge: "",
        openInNewTab: false,
        children: [],
      },
      {
        id: "f-2",
        label: "Combos",
        url: "/combo",
        badge: "",
        openInNewTab: false,
        children: [],
      },
      {
        id: "f-3",
        label: "Terms & Conditions",
        url: "/terms-and-conditions",
        badge: "",
        openInNewTab: false,
        children: [],
      },
    ],
  },
]

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get("location")
    const slug = searchParams.get("slug")

    const { db } = await connectToDatabase()
    let menus = await db.collection("menus").find({}).sort({ createdAt: 1 }).toArray()

    // Detect if database still has the legacy flat-item structure or is empty
    const isLegacy = menus.length > 0 && menus.some((m) => m.label && !m.title)
    if (menus.length === 0 || isLegacy) {
      if (isLegacy) {
        await db.collection("menus").deleteMany({})
      }
      const now = new Date()
      const seeded = INITIAL_MENUS.map((m) => ({
        ...m,
        createdAt: now,
        updatedAt: now,
      }))
      await db.collection("menus").insertMany(seeded)
      menus = await db.collection("menus").find({}).sort({ createdAt: 1 }).toArray()
    }

    if (slug) {
      const single = menus.find((m) => m.slug === slug)
      return NextResponse.json(single || null)
    }

    if (location) {
      const match = menus.find((m) => m.location === location && m.isActive !== false)
      return NextResponse.json(match || null)
    }

    return NextResponse.json(menus)
  } catch (error) {
    console.error("GET /api/menus error:", error)
    return NextResponse.json({ error: "Failed to fetch menus" }, { status: 500 })
  }
}

export async function POST(request) {
  const admin = await getAdminAuth()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const title = body.title?.trim()
    if (!title) {
      return NextResponse.json({ error: "Menu title is required" }, { status: 400 })
    }

    const slug =
      body.slug?.trim() ||
      title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

    const { db } = await connectToDatabase()

    // Check slug collision
    const existing = await db.collection("menus").findOne({ slug })
    const finalSlug = existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug

    const menu = {
      title,
      slug: finalSlug,
      location: body.location || "custom", // "header" | "footer" | "custom"
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      items: Array.isArray(body.items) ? body.items : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("menus").insertOne(menu)
    return NextResponse.json({ _id: result.insertedId, ...menu }, { status: 201 })
  } catch (error) {
    console.error("POST /api/menus error:", error)
    return NextResponse.json({ error: "Failed to create menu" }, { status: 500 })
  }
}

export async function PUT(request) {
  const admin = await getAdminAuth()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const { _id, ...updateData } = body

    if (!_id || !ObjectId.isValid(_id)) {
      return NextResponse.json({ error: "Valid menu ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const sanitized = {
      ...updateData,
      title: updateData.title?.trim(),
      slug: updateData.slug?.trim(),
      location: updateData.location || "custom",
      isActive: updateData.isActive !== undefined ? Boolean(updateData.isActive) : true,
      items: Array.isArray(updateData.items) ? updateData.items : [],
      updatedAt: new Date(),
    }

    const result = await db.collection("menus").updateOne(
      { _id: new ObjectId(_id) },
      { $set: sanitized }
    )

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("PUT /api/menus error:", error)
    return NextResponse.json({ error: "Failed to update menu" }, { status: 500 })
  }
}

export async function DELETE(request) {
  const admin = await getAdminAuth()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid menu ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    await db.collection("menus").deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/menus error:", error)
    return NextResponse.json({ error: "Failed to delete menu" }, { status: 500 })
  }
}
