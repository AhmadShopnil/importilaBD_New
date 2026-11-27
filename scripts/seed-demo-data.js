import { MongoClient, ObjectId } from "mongodb";
import nextEnv from "@next/env";
import { generateSKU } from "../lib/sku.js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

async function seedDemoData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not defined in .env");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas successfully");

    const dbName = process.env.MONGODB_DB_NAME || "kids_e_shop";
    const db = client.db(dbName);

    // 1. Seed Categories
    console.log("\nSeeding categories...");
    const categoriesCollection = db.collection("categories");
    await categoriesCollection.deleteMany({}); // Fresh demo categories

    const demoCategories = [
      {
        name: "Boys Collection",
        slug: "boys",
        description: "Comfortable and trendy clothing for active boys",
        image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&auto=format&fit=crop&q=80",
        parentId: null,
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Girls Collection",
        slug: "girls",
        description: "Adorable, colorful dresses and casuals for girls",
        image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&auto=format&fit=crop&q=80",
        parentId: null,
        isActive: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Toddlers & Baby",
        slug: "toddlers-baby",
        description: "Ultra-soft cotton essentials for babies and toddlers",
        image: "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600&auto=format&fit=crop&q=80",
        parentId: null,
        isActive: true,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Combos & Sets",
        slug: "combos-sets",
        description: "Value bundle packs and matching outfit sets",
        image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600&auto=format&fit=crop&q=80",
        parentId: null,
        isActive: true,
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const categoryInsertResult = await categoriesCollection.insertMany(demoCategories);
    const categoryIds = Object.values(categoryInsertResult.insertedIds).map(id => id.toString());
    console.log(`Seeded ${categoryIds.length} categories`);

    // 2. Seed Products with standard SKUs
    console.log("\nSeeding products...");
    const productsCollection = db.collection("products");
    await productsCollection.deleteMany({}); // Fresh demo products

    const demoProducts = [
      {
        name: "Boys Adventure Dino Graphic T-Shirt",
        description: "100% breathable combed cotton with durable dinosaur graphic print. Soft rib neck and double-needle hem.",
        richDescription: "<p>Crafted for all-day comfort and play. Non-toxic water-based screen print that stays bright wash after wash.</p>",
        categories: [categoryIds[0]],
        price: 550,
        offerPrice: 420,
        purchasePrice: 220,
        isFeatured: true,
        isActive: true,
        isTrashed: false,
        designName: "DINO-ADV",
        featuredImage: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop&q=80",
        images: [
          "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&auto=format&fit=crop&q=80"
        ],
        variants: [
          {
            sku: generateSKU("DINO-ADV", "Navy Blue", "2Y-3Y"),
            colorName: "Navy Blue",
            colorHex: "#1B2A4A",
            size: "2Y-3Y",
            stock: 35,
            image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop&q=80",
          },
          {
            sku: generateSKU("DINO-ADV", "Navy Blue", "4Y-5Y"),
            colorName: "Navy Blue",
            colorHex: "#1B2A4A",
            size: "4Y-5Y",
            stock: 40,
            image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop&q=80",
          },
          {
            sku: generateSKU("DINO-ADV", "Mustard Yellow", "2Y-3Y"),
            colorName: "Mustard Yellow",
            colorHex: "#E5A93B",
            size: "2Y-3Y",
            stock: 25,
            image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&auto=format&fit=crop&q=80",
          },
          {
            sku: generateSKU("DINO-ADV", "Mustard Yellow", "4Y-5Y"),
            colorName: "Mustard Yellow",
            colorHex: "#E5A93B",
            size: "4Y-5Y",
            stock: 30,
            image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&auto=format&fit=crop&q=80",
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Girls Sweet Meadow Floral Summer Frock",
        description: "Lightweight and airy pure cotton frock featuring delicate floral patterns and soft flutter sleeves.",
        richDescription: "<p>Perfect for warm summer days and family outings. Features smooth inner lining for sensitive baby skin.</p>",
        categories: [categoryIds[1]],
        price: 750,
        offerPrice: 590,
        purchasePrice: 310,
        isFeatured: true,
        isActive: true,
        isTrashed: false,
        designName: "FLORAL-MDW",
        featuredImage: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format&fit=crop&q=80",
        images: [
          "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format&fit=crop&q=80"
        ],
        variants: [
          {
            sku: generateSKU("FLORAL-MDW", "Blush Pink", "1Y-2Y"),
            colorName: "Blush Pink",
            colorHex: "#F7C5CC",
            size: "1Y-2Y",
            stock: 20,
            image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format&fit=crop&q=80",
          },
          {
            sku: generateSKU("FLORAL-MDW", "Blush Pink", "3Y-4Y"),
            colorName: "Blush Pink",
            colorHex: "#F7C5CC",
            size: "3Y-4Y",
            stock: 28,
            image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format&fit=crop&q=80",
          },
          {
            sku: generateSKU("FLORAL-MDW", "Sky Blue", "1Y-2Y"),
            colorName: "Sky Blue",
            colorHex: "#A0C4E2",
            size: "1Y-2Y",
            stock: 18,
            image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format&fit=crop&q=80",
          },
          {
            sku: generateSKU("FLORAL-MDW", "Sky Blue", "3Y-4Y"),
            colorName: "Sky Blue",
            colorHex: "#A0C4E2",
            size: "3Y-4Y",
            stock: 22,
            image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format&fit=crop&q=80",
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Toddler Organic Cotton Ribbed Romper",
        description: "Super-comfy stretch-rib romper with easy-snap crotch buttons for effortless diaper changes.",
        richDescription: "<p>Made with certified organic baby-soft cotton. Tagless neckline prevents itching.</p>",
        categories: [categoryIds[2]],
        price: 600,
        offerPrice: 480,
        purchasePrice: 240,
        isFeatured: true,
        isActive: true,
        isTrashed: false,
        designName: "ROMPER-RIB",
        featuredImage: "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&auto=format&fit=crop&q=80",
        images: [
          "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&auto=format&fit=crop&q=80"
        ],
        variants: [
          {
            sku: generateSKU("ROMPER-RIB", "Sage Green", "0-6M"),
            colorName: "Sage Green",
            colorHex: "#9CB096",
            size: "0-6M",
            stock: 30,
            image: "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&auto=format&fit=crop&q=80",
          },
          {
            sku: generateSKU("ROMPER-RIB", "Sage Green", "6-12M"),
            colorName: "Sage Green",
            colorHex: "#9CB096",
            size: "6-12M",
            stock: 35,
            image: "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&auto=format&fit=crop&q=80",
          },
          {
            sku: generateSKU("ROMPER-RIB", "Warm Oatmeal", "0-6M"),
            colorName: "Warm Oatmeal",
            colorHex: "#E3DAC9",
            size: "0-6M",
            stock: 25,
            image: "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&auto=format&fit=crop&q=80",
          },
          {
            sku: generateSKU("ROMPER-RIB", "Warm Oatmeal", "6-12M"),
            colorName: "Warm Oatmeal",
            colorHex: "#E3DAC9",
            size: "6-12M",
            stock: 30,
            image: "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&auto=format&fit=crop&q=80",
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Kids Everyday Soft Terry Drawstring Shorts",
        description: "Durable French terry shorts with adjustable elastic drawstring waistband and deep side pockets.",
        richDescription: "<p>Designed for active kids. Breathable loopback fabric keeps them cool during sports and outdoor play.</p>",
        categories: [categoryIds[0], categoryIds[3]],
        price: 450,
        offerPrice: 350,
        purchasePrice: 180,
        isFeatured: false,
        isActive: true,
        isTrashed: false,
        designName: "TERRY-SHORTS",
        featuredImage: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&auto=format&fit=crop&q=80",
        images: [
          "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&auto=format&fit=crop&q=80"
        ],
        variants: [
          {
            sku: generateSKU("TERRY-SHORTS", "Heather Grey", "4Y-5Y"),
            colorName: "Heather Grey",
            colorHex: "#B0B0B0",
            size: "4Y-5Y",
            stock: 50,
            image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&auto=format&fit=crop&q=80",
          },
          {
            sku: generateSKU("TERRY-SHORTS", "Heather Grey", "6Y-7Y"),
            colorName: "Heather Grey",
            colorHex: "#B0B0B0",
            size: "6Y-7Y",
            stock: 45,
            image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&auto=format&fit=crop&q=80",
          },
          {
            sku: generateSKU("TERRY-SHORTS", "Jet Black", "4Y-5Y"),
            colorName: "Jet Black",
            colorHex: "#1C1C1C",
            size: "4Y-5Y",
            stock: 40,
            image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&auto=format&fit=crop&q=80",
          },
          {
            sku: generateSKU("TERRY-SHORTS", "Jet Black", "6Y-7Y"),
            colorName: "Jet Black",
            colorHex: "#1C1C1C",
            size: "6Y-7Y",
            stock: 35,
            image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&auto=format&fit=crop&q=80",
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Kids Rainbow Stripe Casual Polo Tee",
        description: "Classic collar polo with retro pastel rainbow stripes. Premium piqué cotton knit with mother-of-pearl buttons.",
        richDescription: "<p>Smart casual style suitable for birthday parties, preschool, and festive celebrations.</p>",
        categories: [categoryIds[0], categoryIds[1]],
        price: 680,
        offerPrice: 520,
        purchasePrice: 270,
        isFeatured: true,
        isActive: true,
        isTrashed: false,
        designName: "POLO-RNBW",
        featuredImage: "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=800&auto=format&fit=crop&q=80",
        images: [
          "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=800&auto=format&fit=crop&q=80"
        ],
        variants: [
          {
            sku: generateSKU("POLO-RNBW", "Pastel Multi", "2Y-3Y"),
            colorName: "Pastel Multi",
            colorHex: "#F28E2B",
            size: "2Y-3Y",
            stock: 25,
            image: "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=800&auto=format&fit=crop&q=80",
          },
          {
            sku: generateSKU("POLO-RNBW", "Pastel Multi", "4Y-5Y"),
            colorName: "Pastel Multi",
            colorHex: "#F28E2B",
            size: "4Y-5Y",
            stock: 30,
            image: "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=800&auto=format&fit=crop&q=80",
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const productInsertResult = await productsCollection.insertMany(demoProducts);
    const insertedProductIds = Object.values(productInsertResult.insertedIds);
    console.log(`Seeded ${demoProducts.length} products with standardized SKUs`);

    // 3. Seed Sliders (hero_home)
    console.log("\nSeeding sliders...");
    const slidersCollection = db.collection("sliders");
    await slidersCollection.deleteMany({ location: "hero_home" });

    const demoSlider = {
      name: "Home Hero Main Banner",
      location: "hero_home",
      isActive: true,
      slides: [
        {
          title: "Bright & Fun Kids Fashion",
          subtitle: "100% Pure Organic Cotton for Active Little Explorers",
          image: "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=1600&auto=format&fit=crop&q=80",
          link: "/shop",
          order: 1,
        },
        {
          title: "Summer Collection 2026",
          subtitle: "Discover Colorful & Comfy Outfits Starting at ৳350",
          image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1600&auto=format&fit=crop&q=80",
          link: "/shop",
          order: 2,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await slidersCollection.insertOne(demoSlider);
    console.log("Seeded hero_home slider");

    // 4. Seed Settings
    console.log("\nSeeding settings...");
    const settingsCollection = db.collection("settings");
    await settingsCollection.updateOne(
      { type: "general" },
      {
        $set: {
          type: "general",
          storeName: "Importila Kids",
          storeEmail: "support@importilabd.com",
          storePhone: "01700-000000",
          storeAddress: "House 12, Road 5, Dhanmondi, Dhaka, Bangladesh",
          currency: "BDT",
          currencySymbol: "৳",
          metaTitle: "Importila Kids - Quality Clothing for Happy Kids",
          metaDescription: "Shop high quality kids t-shirts, dresses, rompers, and combo packs in Bangladesh with fast cash on delivery.",
          lowStockThreshold: 10,
          orderPrefix: "ORD",
          deliveryChargeInsideDhaka: 70,
          deliveryChargeOutsideDhaka: 130,
          termsAndConditions: `
            <h2>1. General Information</h2>
            <p>Welcome to Importila Kids Shop. By placing an order with us, you agree to the following terms and conditions.</p>
            <h2>2. Shipping & Delivery</h2>
            <p>We deliver all across Bangladesh. Standard delivery takes 2-3 business days inside Dhaka and 3-5 business days outside Dhaka.</p>
            <h2>3. Cash on Delivery & Exchange</h2>
            <p>We offer Cash on Delivery (COD). You may check the product in front of the delivery partner. We offer free size exchanges within 7 days of delivery.</p>
          `,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
    console.log("Seeded general store settings");

    // 5. Seed Combo Pack
    console.log("\nSeeding combo pack...");
    const combosCollection = db.collection("combos");
    await combosCollection.deleteMany({});

    const demoCombo = {
      title: "Kids Super Saver Summer Combo Pack",
      slug: "kids-summer-combo-pack",
      landingPageTitle: "Premium Kids Summer Combo Collection",
      landingPageSubtitle: "Mix & Match Your Favorite Designs and Save Up to 41%",
      landingPageDetails: "Crafted with 100% breathable organic cotton, gentle on kids skin. Choose 3, 6, 7, or 10 pieces with exciting bundle discounts!",
      heroBadge: "Best Value Bundle • Save Up to 41%",
      heroCTA: "পছন্দের বান্ডেলটি বেছে নিন",
      bundleTitle: "Choose Your Bundle Size",
      bundleSubtitle: "Select how many pieces you want in this combo",
      productGridTitle: "Select Your Favorite Styles & Colors",
      sizeSelectionTitle: "Choose Size for Combo Pack",
      checkoutFormTitle: "Complete Your Combo Order",
      checkoutFormSubtitle: "Cash on delivery available all over Bangladesh",
      checkoutCTA: "অর্ডার কনফার্ম করুন",
      whatsappNumber: "8801700000000",
      messengerUsername: "importilakids",
      helpTitle: "Need help choosing sizes?",
      helpSubtitle: "Call or WhatsApp our support team 24/7",
      description: "Exclusive value combo pack featuring premium cotton t-shirts, rompers, and terry shorts.",
      price: 1350,
      offerPrice: 999,
      sizes: ["2Y-3Y", "4Y-5Y", "6Y-7Y"],
      products: insertedProductIds,
      bundleOptions: [
        { pieces: 3, price: 999, originalPrice: 1350, savings: "26%" },
        { pieces: 6, price: 1790, originalPrice: 2700, savings: "34%", popular: true },
        { pieces: 7, price: 1990, originalPrice: 3150, savings: "37%" },
        { pieces: 10, price: 2650, originalPrice: 4500, savings: "41%" },
      ],
      featuredImage: "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=800&auto=format&fit=crop&q=80",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await combosCollection.insertOne(demoCombo);
    console.log("Seeded combo pack: Kids Super Saver Summer Combo Pack");

    console.log("\n All demo data seeded successfully (No orders created)!");

  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB server");
  }
}

seedDemoData();
