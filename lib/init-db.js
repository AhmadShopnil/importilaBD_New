import { connectToDatabase } from "./mongodb.js"
import bcrypt from "bcryptjs"

export async function initializeDatabase() {
  try {
    const { db } = await connectToDatabase()

    // Create collections if they don't exist
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map((col) => col.name)

    const requiredCollections = ["products", "categories", "orders", "users", "settings", "daily_sales", "media", "sliders"]

    for (const collectionName of requiredCollections) {
      if (!collectionNames.includes(collectionName)) {
        await db.createCollection(collectionName)
        console.log(`Created collection: ${collectionName}`)
      }
    }

    // Ensure indexes for performance
    await db.collection("products").createIndex({ "variants.sku": 1 })
    await db.collection("products").createIndex({ isTrashed: 1, isActive: 1 })
    await db.collection("orders").createIndex({ createdAt: -1 })
    await db.collection("orders").createIndex({ orderNumber: 1 }, { unique: true, sparse: true })
    await db.collection("users").createIndex({ username: 1 }, { unique: true })
    await db.collection("daily_sales").createIndex({ date: 1 }, { unique: true })

    // Seed super admin if no users exist
    const userCount = await db.collection("users").countDocuments()
    if (userCount === 0) {
      const ADMIN_USER = process.env.ADMIN_USER
      const ADMIN_PASS = process.env.ADMIN_PASS

      if (!ADMIN_USER || !ADMIN_PASS) {
        console.error("⚠️  ADMIN_USER and ADMIN_PASS env vars must be set to seed the super admin.")
        console.error("   Add them to your .env file and restart.")
      } else {
        const hashedPassword = await bcrypt.hash(ADMIN_PASS, 10)
        await db.collection("users").insertOne({
          name: "Super Admin",
          username: ADMIN_USER,
          password: hashedPassword,
          role: "super_admin",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        console.log(`✅ Super admin seeded with username: ${ADMIN_USER}`)
      }
    }

    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Failed to initialize database:", error)
  }
}
