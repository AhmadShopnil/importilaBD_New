import { MongoClient } from "mongodb"

let cached = globalThis.mongoCache

if (!cached) {
  cached = globalThis.mongoCache = { conn: null, promise: null }
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable")
  }

  if (!cached.promise) {
    const opts = {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    }
    const client = new MongoClient(process.env.MONGODB_URI, opts)
    
    cached.promise = client.connect().then((client) => {
      const dbName = process.env.MONGODB_DB_NAME || "kids_e_shop"
      const db = client.db(dbName)
      return { client, db }
    }).catch((error) => {
      console.error("Failed to connect to MongoDB:", error)
      cached.promise = null
      throw error
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (error) {
    cached.promise = null
    throw error
  }

  return cached.conn
}
