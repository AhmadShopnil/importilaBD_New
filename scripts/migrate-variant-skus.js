import { MongoClient } from "mongodb";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

function slugify(str) {
  return String(str || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateSKU(designName, colorName, size) {
  const parts = [];
  if (designName) parts.push(slugify(designName));
  if (colorName) parts.push(slugify(colorName));
  if (size) parts.push(slugify(size));
  return parts.join("-") || `SKU-${Date.now()}`;
}

async function migrateVariantSKUs() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("Please define MONGODB_URI in .env or .env.local");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB successfully");

    const dbName = process.env.MONGODB_DB_NAME || process.env.MONGODB_DB || "importila";
    const db = client.db(dbName);
    const productsCollection = db.collection("products");

    const products = await productsCollection.find({}).toArray();
    console.log(`Found ${products.length} products to check...`);

    let updatedProductsCount = 0;
    let updatedVariantsCount = 0;

    for (const product of products) {
      if (!product.variants || !Array.isArray(product.variants) || product.variants.length === 0) {
        continue;
      }

      let productModified = false;
      const seenSkus = new Set();

      const updatedVariants = product.variants.map((variant, index) => {
        let vModified = false;
        const colorName = variant.colorName || variant.color || `COLOR${index + 1}`;
        const size = variant.size || "STD";

        const newVariant = { ...variant };

        if (!newVariant.colorName && colorName) {
          newVariant.colorName = colorName;
          vModified = true;
        }

        let sku = newVariant.sku;
        if (!sku) {
          const baseSku = generateSKU(product.designName || product.name, colorName, size);
          sku = baseSku;
          let counter = 1;
          while (seenSkus.has(sku)) {
            sku = `${baseSku}-${counter++}`;
          }
          newVariant.sku = sku;
          vModified = true;
          updatedVariantsCount++;
        }

        seenSkus.add(sku);

        if (vModified) {
          productModified = true;
        }

        return newVariant;
      });

      if (productModified) {
        await productsCollection.updateOne(
          { _id: product._id },
          { $set: { variants: updatedVariants, updatedAt: new Date() } }
        );
        updatedProductsCount++;
      }
    }

    console.log(`\nMigration Summary:`);
    console.log(`- Total products scanned: ${products.length}`);
    console.log(`- Products updated: ${updatedProductsCount}`);
    console.log(`- Variant SKUs generated/fixed: ${updatedVariantsCount}`);

    // Ensure index on variants.sku
    await productsCollection.createIndex({ "variants.sku": 1 });
    console.log("Ensured index on products.variants.sku");

  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB server");
  }
}

migrateVariantSKUs();
