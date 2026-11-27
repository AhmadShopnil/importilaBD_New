const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');

const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/MONGODB_URI=(.+)/);
const uri = match ? match[1].trim() : '';

const BANGLADESHI_NAMES = [
  "Tanvir Ahmed", "Rahim Uddin", "Farhana Akter", "Shopnil Hossain",
  "Sadia Islam", "Mehedi Hasan", "Nusrat Jahan", "Arifur Rahman",
  "Tasmia Rahman", "Kazi Nazrul", "Mahmudul Hasan", "Anika Tabassum",
  "Sabbir Hossain", "Ishrat Jahan", "Kamrul Islam", "Rifat Chowdhury",
  "Fatima Begum", "Shahriar Kabir", "Nazmul Huda", "Jannatul Ferdous",
  "Mustafizur Rahman", "Shakil Ahmed", "Ayesha Siddiqua", "Zubair Al Mahmud"
];

const DISTRICTS = [
  { city: "Dhaka", district: "Dhaka", shipping: 60 },
  { city: "Chittagong", district: "Chittagong", shipping: 120 },
  { city: "Sylhet", district: "Sylhet", shipping: 120 },
  { city: "Rajshahi", district: "Rajshahi", shipping: 120 },
  { city: "Khulna", district: "Khulna", shipping: 120 },
  { city: "Gazipur", district: "Gazipur", shipping: 60 },
  { city: "Narayanganj", district: "Narayanganj", shipping: 60 },
  { city: "Cumilla", district: "Cumilla", shipping: 120 },
  { city: "Bogra", district: "Bogra", shipping: 120 },
  { city: "Barisal", district: "Barisal", shipping: 120 },
];

const CHANNELS = ["website", "facebook", "whatsapp", "call", "instagram"];
const CHANNEL_WEIGHTS = [0.45, 0.30, 0.12, 0.08, 0.05];

function pickChannel() {
  const rand = Math.random();
  let cumulative = 0;
  for (let i = 0; i < CHANNELS.length; i++) {
    cumulative += CHANNEL_WEIGHTS[i];
    if (rand <= cumulative) return CHANNELS[i];
  }
  return "website";
}

async function seed() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('kids_e_shop');

  const products = await db.collection('products').find({}).limit(20).toArray();
  const combos = await db.collection('combos').find({}).limit(5).toArray();

  console.log(`Found ${products.length} catalog products, ${combos.length} combos.`);

  const now = new Date();
  const orders = [];

  // Generate 45 realistic orders over the last 30 days
  for (let i = 0; i < 48; i++) {
    const customer = BANGLADESHI_NAMES[Math.floor(Math.random() * BANGLADESHI_NAMES.length)];
    const location = DISTRICTS[Math.floor(Math.random() * DISTRICTS.length)];
    const phone = `017${Math.floor(10000000 + Math.random() * 90000000)}`;
    const channel = pickChannel();

    // Spread across past 30 days, with more orders in recent days
    let dayOffset;
    if (i < 8) {
      dayOffset = 0; // Today
    } else if (i < 15) {
      dayOffset = 1; // Yesterday
    } else if (i < 30) {
      dayOffset = Math.floor(2 + Math.random() * 6); // 2-7 days ago
    } else {
      dayOffset = Math.floor(7 + Math.random() * 22); // 8-29 days ago
    }

    const orderDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000 - Math.random() * 12 * 60 * 60 * 1000);

    // Pick status based on recency
    let status, paymentStatus;
    if (dayOffset === 0) {
      // Today: mostly pending, confirmed, processing
      const r = Math.random();
      if (r < 0.5) status = "pending";
      else if (r < 0.8) status = "confirmed";
      else status = "delivered";
      paymentStatus = status === "delivered" ? "paid" : "unpaid";
    } else if (dayOffset === 1) {
      // Yesterday: confirmed, shipped, or delivered
      const r = Math.random();
      if (r < 0.3) status = "confirmed";
      else if (r < 0.6) status = "shipped";
      else if (r < 0.9) status = "delivered";
      else status = "cancelled";
      paymentStatus = status === "delivered" ? "paid" : "unpaid";
    } else {
      // Older orders: ~75% delivered, 15% cancelled/returned, 10% in-transit
      const r = Math.random();
      if (r < 0.75) status = "delivered";
      else if (r < 0.85) status = "returned";
      else if (r < 0.95) status = "cancelled";
      else status = "shipped";
      paymentStatus = status === "delivered" ? "paid" : (status === "returned" ? "refunded" : "unpaid");
    }

    // Build order items
    const isCombo = combos.length > 0 && Math.random() < 0.25;
    let items = [];
    let subtotal = 0;

    if (isCombo) {
      const combo = combos[Math.floor(Math.random() * combos.length)];
      const price = Number(combo.price || combo.comboPrice || 1450);
      items.push({
        productId: combo._id.toString(),
        title: combo.title || combo.name || "Kids Special Combo Set",
        price,
        quantity: 1,
        color: "Combo Pack",
        size: "Standard",
        image: combo.thumbnail || combo.image || "/logo.svg"
      });
      subtotal = price;
    } else if (products.length > 0) {
      const numItems = Math.random() < 0.7 ? 1 : 2;
      for (let j = 0; j < numItems; j++) {
        const prod = products[Math.floor(Math.random() * products.length)];
        const price = Number(prod.price || prod.offerPrice || 650);
        const qty = Math.random() < 0.8 ? 1 : 2;
        items.push({
          productId: prod._id.toString(),
          title: prod.title || prod.name || "Cotton Kids T-Shirt",
          price,
          quantity: qty,
          color: prod.variants?.[0]?.colorName || prod.variants?.[0]?.color || "Default",
          size: prod.variants?.[0]?.size || "M",
          image: prod.featuredImage || prod.images?.[0] || prod.image || "/logo.svg"
        });
        subtotal += price * qty;
      }
    } else {
      // Fallback items if no catalog products
      subtotal = 1150;
      items.push({
        productId: new ObjectId().toString(),
        title: "Premium Baby Romper Set",
        price: 1150,
        quantity: 1,
        color: "Yellow",
        size: "1-2Y",
        image: "/logo.svg"
      });
    }

    const shippingCharge = location.shipping;
    const discount = Math.random() < 0.15 ? 50 : 0;
    const totalAmount = subtotal + shippingCharge - discount;

    const orderNumber = `ORD-${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}-${1000 + i}`;

    orders.push({
      orderNumber,
      customerName: customer,
      phone,
      address: `${Math.floor(10 + Math.random() * 90)}, Road ${Math.floor(1 + Math.random() * 20)}, Sector ${Math.floor(1 + Math.random() * 14)}, ${location.city}`,
      city: location.city,
      district: location.district,
      productType: isCombo ? "combo" : "regular",
      items,
      subtotal,
      shippingCharge,
      discount,
      totalAmount,
      totalPrice: totalAmount, // for fallback compatibility
      status,
      paymentStatus,
      paymentMethod: Math.random() < 0.85 ? "cod" : "bkash",
      orderSource: channel,
      courier: {
        provider: "steadfast",
        trackingCode: `ST${orderDate.getFullYear()}${10000 + i}`,
        status: status === "delivered" ? "delivered" : status === "cancelled" ? "cancelled" : "in_review"
      },
      createdAt: orderDate,
      updatedAt: orderDate
    });
  }

  // Insert orders
  const result = await db.collection('orders').insertMany(orders);
  console.log(`Successfully seeded ${result.insertedCount} orders!`);

  // Print summary by status and source
  const statusCounts = {};
  const sourceCounts = {};
  let totalRevenue = 0;
  for (const o of orders) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    sourceCounts[o.orderSource] = (sourceCounts[o.orderSource] || 0) + 1;
    if (o.status === "delivered") totalRevenue += o.totalAmount;
  }

  console.log('Status breakdown:', statusCounts);
  console.log('Channel breakdown:', sourceCounts);
  console.log('Total Delivered Revenue seeded: ৳', totalRevenue.toLocaleString());

  await client.close();
}

seed().catch(console.error);
