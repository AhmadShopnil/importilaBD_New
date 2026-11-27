import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { NextResponse } from "next/server"
import { generateSKU } from "@/lib/sku"

// Version 2 Checkout - Variant-specific stock management
export async function POST(request) {
  try {
    const body = await request.json()
    const { customerName, customerEmail, customerPhone, items } = body

    // Validation
    if (!customerName || !customerEmail || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: customerName, customerEmail, items" },
        { status: 400 },
      )
    }

    // Validate minimum 3 items requirement
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    if (totalItems < 3) {
      return NextResponse.json(
        { error: "Minimum order quantity is 3 items. Currently: " + totalItems },
        { status: 400 },
      )
    }

    const { db } = await connectToDatabase()

    // Check stock availability for each variant and prepare updates
    const resolvedVariants = []
    for (const item of items) {
      if (!ObjectId.isValid(item.productId)) {
        return NextResponse.json({ error: `Invalid product ID: ${item.productId}` }, { status: 400 })
      }

      const product = await db.collection("products").findOne({
        _id: new ObjectId(item.productId),
      })

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 })
      }

      // Find variant and check stock
      const variant = product.variants?.find(
        (v) => (item.sku && v.sku === item.sku) ||
          ((v.colorName === (item.colorName || item.color) || v.color === (item.colorName || item.color)) && v.size === item.size)
      )

      if (!variant) {
        return NextResponse.json(
          {
            error: `Variant not found for product ${product.name} (${item.colorName || item.color || ""} ${item.size})`,
          },
          { status: 404 },
        )
      }

      if (variant.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name} - ${variant.colorName || item.color} ${item.size}. Available: ${variant.stock}, Requested: ${item.quantity}`,
          },
          { status: 400 },
        )
      }

      resolvedVariants.push({
        productId: product._id,
        sku: variant.sku,
        colorName: variant.colorName || item.color,
        size: variant.size || item.size,
        quantity: item.quantity,
      })
    }

    // Calculate total price
    let totalPrice = 0
    for (const item of items) {
      totalPrice += item.price * item.quantity
    }

    // Create order
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
    const orderResult = await db.collection("orders").insertOne({
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      items: items.map((item, idx) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        sku: resolvedVariants[idx]?.sku || item.sku,
        colorName: resolvedVariants[idx]?.colorName || item.color,
        size: item.size,
      })),
      totalPrice,
      totalItems,
      status: "pending",
      paymentStatus: "unpaid",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Deduct stock from each variant
    for (const resVar of resolvedVariants) {
      const filter = resVar.sku
        ? { _id: resVar.productId, "variants.sku": resVar.sku }
        : { _id: resVar.productId, "variants.colorName": resVar.colorName, "variants.size": resVar.size }

      const updateResult = await db.collection("products").updateOne(
        filter,
        {
          $inc: { "variants.$.stock": -resVar.quantity },
        },
      )

      if (updateResult.modifiedCount === 0) {
        // Rollback order if stock update fails
        await db.collection("orders").deleteOne({
          _id: orderResult.insertedId,
        })
        return NextResponse.json({ error: "Failed to update stock. Order cancelled." }, { status: 500 })
      }
    }

    // Record daily sales
    const today = new Date().toISOString().split("T")[0]
    await db.collection("daily_sales").updateOne(
      { date: today },
      {
        $inc: {
          totalRevenue: totalPrice,
          totalOrders: 1,
          totalItems: totalItems,
        },
      },
      { upsert: true },
    )

    return NextResponse.json(
      {
        success: true,
        orderNumber,
        orderId: orderResult.insertedId,
        totalPrice,
        totalItems,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("POST /api/checkout error:", error)
    return NextResponse.json({ error: "Failed to create order: " + error.message }, { status: 500 })
  }
}
