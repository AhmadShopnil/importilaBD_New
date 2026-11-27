import { connectToDatabase } from "@/lib/mongodb"
import { NextResponse } from "next/server"
import { uploadToCloudinary } from "@/lib/cloudinary"
import { getAdminAuth } from "@/lib/auth"
import { assignSKUs } from "@/lib/sku"
import { ObjectId } from "mongodb"

/* ================= GET ================= */
export async function GET(request) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)

    // Filtering - supports both 'categories' and 'category', comma-separated or single
    const rawCategories = searchParams.get("categories") || searchParams.get("category") || ""
    const categoryTokens = rawCategories
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)

    const minPrice = Number(searchParams.get("minPrice")) || 0
    const maxPrice = Number(searchParams.get("maxPrice")) || Infinity
    const search = searchParams.get("search")
    const isFeatured = searchParams.get("featured") === "true"

    // Pagination
    const page = Number(searchParams.get("page")) || 1
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 200)
    const skip = (page - 1) * limit

    // Sorting
    const sortStr = searchParams.get("sort") || "newest" // newest, price-asc, price-desc
    let sortQuery = { createdAt: -1 }
    if (sortStr === "price-asc") sortQuery = { price: 1 }
    if (sortStr === "price-desc") sortQuery = { price: -1 }

    let query = {}

    // Resolve Category Tokens (supports both ObjectId strings, slugs, and child subcategories)
    if (categoryTokens.length > 0) {
      const orConditions = [
        { slug: { $in: categoryTokens } },
        { name: { $in: categoryTokens } },
        { _id: { $in: categoryTokens } },
      ]

      const validObjIds = categoryTokens
        .filter((t) => /^[0-9a-fA-F]{24}$/.test(t))
        .map((t) => new ObjectId(t))

      if (validObjIds.length > 0) {
        orConditions.push({ _id: { $in: validObjIds } })
      }

      const matchedCats = await db.collection("categories").find({ $or: orConditions }).toArray()

      const resolvedCategoryIds = new Set(categoryTokens)
      const parentIdsToQuery = []

      matchedCats.forEach((c) => {
        const idStr = c._id.toString()
        resolvedCategoryIds.add(idStr)
        if (c.slug) resolvedCategoryIds.add(c.slug)
        parentIdsToQuery.push(idStr)
      })

      // Also look up any child categories if a parent category was selected
      if (parentIdsToQuery.length > 0) {
        const childCats = await db
          .collection("categories")
          .find({ parentId: { $in: parentIdsToQuery } })
          .toArray()

        childCats.forEach((child) => {
          resolvedCategoryIds.add(child._id.toString())
          if (child.slug) resolvedCategoryIds.add(child.slug)
        })
      }

      query.categories = { $in: Array.from(resolvedCategoryIds) }
    }

    if (isFeatured) {
      query.isFeatured = true
    }

    query.isActive = { $ne: false }
    query.isTrashed = { $ne: true }

    // Price range
    if (minPrice > 0 || maxPrice < Infinity) {
      query.price = { $gte: minPrice, $lte: maxPrice }
    }

    if (search) {
      query = {
        ...query,
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      }
    }

    const [products, total] = await Promise.all([
      db.collection("products")
        .find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("products").countDocuments(query)
    ])

    // If page or limit is provided, return the paginated object
    // otherwise return the array directly for backward compatibility
    if (searchParams.has("page") || searchParams.has("limit") || searchParams.has("categories")) {
      return NextResponse.json({
        products,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      })
    }

    return NextResponse.json(products)
  } catch (error) {
    console.error("GET /api/products error:", error)
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}



/* ================= POST ================= */
export async function POST(request) {
  const admin = await getAdminAuth()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await request.formData()

    const name = formData.get("name")
    const description = formData.get("description")
    const richDescription = formData.get("richDescription") || ""
    const categories = JSON.parse(formData.get("categories") || "[]")
    const price = Number(formData.get("price"))
    const offerPrice = Number(formData.get("offerPrice"))
    const isFeatured = formData.get("isFeatured") === "true"
    const isActive = formData.get("isActive") === "true"
    const designName = formData.get("designName") || ""
    const purchasePrice = Number(formData.get("purchasePrice")) || 0
    const variants = JSON.parse(formData.get("variants") || "[]")

    /* ---------- Featured Image ---------- */
    let featuredImage = null
    const featuredFile = formData.get("featuredImage")
    const featuredURL = formData.get("featuredImageURL")

    const { db } = await connectToDatabase()

    if (featuredFile instanceof File && featuredFile.size > 0) {
      const result = await uploadToCloudinary(featuredFile, "products")
      // Save to media collection
      await db.collection("media").insertOne({
        url: result.secure_url,
        publicId: result.public_id,
        folder: "products",
        fileName: featuredFile.name,
        fileSize: featuredFile.size,
        format: result.format,
        width: result.width,
        height: result.height,
        createdAt: new Date(),
      })
      featuredImage = result.secure_url
    } else if (typeof featuredFile === 'string' && featuredFile.startsWith('http')) {
      featuredImage = featuredFile
    } else if (featuredURL) {
      featuredImage = featuredURL
    }

    /* ---------- Size Chart ---------- */
    let sizeChart = null
    const sizeChartFile = formData.get("sizeChart")
    const sizeChartURL = formData.get("sizeChartURL")

    if (sizeChartFile instanceof File && sizeChartFile.size > 0) {
      const result = await uploadToCloudinary(sizeChartFile, "products")
      if (result) {
        await db.collection("media").insertOne({
          url: result.secure_url,
          publicId: result.public_id,
          folder: "products",
          fileName: sizeChartFile.name,
          fileSize: sizeChartFile.size,
          format: result.format,
          width: result.width,
          height: result.height,
          createdAt: new Date(),
        })
        sizeChart = result.secure_url
      }
    } else if (typeof sizeChartFile === 'string' && sizeChartFile.startsWith('http')) {
      sizeChart = sizeChartFile
    } else if (sizeChartURL) {
      sizeChart = sizeChartURL
    }

    if (!name || categories.length === 0 || !featuredImage || isNaN(price)) {
      return NextResponse.json(
        { error: "Missing required fields (Name, Category, Image, or Price)" },
        { status: 400 }
      )
    }

    let variantsWithSKU
    try {
      variantsWithSKU = assignSKUs(variants, designName)
    } catch (skuError) {
      return NextResponse.json({ error: skuError.message }, { status: 400 })
    }

    /* ---------- Extra Images ---------- */
    const images = []

    // Handle files
    for (const file of formData.getAll("images")) {
      if (file instanceof File && file.size > 0) {
        const result = await uploadToCloudinary(file, "products")
        if (result) {
          await db.collection("media").insertOne({
            url: result.secure_url,
            publicId: result.public_id,
            folder: "products",
            fileName: file.name,
            fileSize: file.size,
            format: result.format,
            width: result.width,
            height: result.height,
            createdAt: new Date(),
          })
          images.push(result.secure_url)
        }
      } else if (typeof file === 'string' && file.startsWith('http')) {
        images.push(file)
      }
    }

    // Handle explicit URL fields if any
    const imageURLs = formData.getAll("imageURLs")
    if (imageURLs.length > 0) {
      images.push(...imageURLs)
    }

    /* ---------- DB ---------- */
    const result = await db.collection("products").insertOne({
      name,
      description,
      richDescription,
      categories, // Now an array of category IDs
      price,
      offerPrice,
      purchasePrice,
      isFeatured,
      isActive,
      designName,
      featuredImage, // Store only URL
      sizeChart: sizeChart || null,
      images, // Store only URLs
      variants: variantsWithSKU,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json(
      { _id: result.insertedId },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/products error:", error)
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}
