import { connectToDatabase } from "@/lib/mongodb";
import { cache } from "react";
import { ObjectId } from "mongodb";

// Cache per-request so multiple calls within the same server render (e.g. metadata + layout + page) share 1 query
export const getStoreSettings = cache(async () => {
  try {
    const { db } = await connectToDatabase();
    let settings = await db.collection("settings").findOne({ type: "general" });

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
        currency: "BDT",
        currencySymbol: "৳",
        metaTitle: "Kids Shop - Quality Kids Clothing",
        metaDescription: "Shop for quality kids clothing with fun designs",
        enableGTM: false,
        enableFBPixel: false,
      };
    } else {
      if (settings._id) settings._id = settings._id.toString();
      if (!settings.storeDisplayMode) settings.storeDisplayMode = "logo_only";
      if (!settings.dashboardDisplayMode) settings.dashboardDisplayMode = "logo_only";
      if (!settings.storeName) settings.storeName = "Kids Shop";
      if (!settings.storeLogo) settings.storeLogo = "/logo.svg";
    }

    return settings;
  } catch (error) {
    console.error("dataService.getStoreSettings error:", error);
    return null;
  }
});

export const getStoreMenus = cache(async () => {
  try {
    const { db } = await connectToDatabase();
    const menus = await db
      .collection("menus")
      .find({})
      .sort({ createdAt: 1 })
      .toArray();

    return menus.map((m) => ({
      ...m,
      _id: m._id.toString(),
      items: Array.isArray(m.items) ? m.items : [],
    }));
  } catch (error) {
    console.error("dataService.getStoreMenus error:", error);
    return [];
  }
});

export const getSlidersByLocation = cache(async (location) => {
  try {
    const { db } = await connectToDatabase();
    const slider = await db.collection("sliders").findOne({
      location,
      isActive: true,
    });

    if (!slider) return [];
    return slider.slides || [];
  } catch (error) {
    console.error("dataService.getSlidersByLocation error:", error);
    return [];
  }
});

export const getStoreProducts = cache(async (limit = 20) => {
  try {
    const { db } = await connectToDatabase();
    const products = await db
      .collection("products")
      .find({ isActive: { $ne: false }, isTrashed: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return products.map((p) => ({
      ...p,
      _id: p._id.toString(),
      price: Number(p.price || 0),
      offerPrice: Number(p.offerPrice || 0),
    }));
  } catch (error) {
    console.error("dataService.getStoreProducts error:", error);
    return [];
  }
});

export const getStoreCombos = cache(async () => {
  try {
    const { db } = await connectToDatabase();
    const combos = await db
      .collection("combos")
      .find({ isActive: { $ne: false } })
      .sort({ createdAt: -1 })
      .toArray();

    return combos.map((c) => ({
      ...c,
      _id: c._id.toString(),
      price: Number(c.price || 0),
      comboPrice: Number(c.comboPrice || 0),
      regularPrice: Number(c.regularPrice || 0),
    }));
  } catch (error) {
    console.error("dataService.getStoreCombos error:", error);
    return [];
  }
});

export const getComboBySlug = cache(async (slug) => {
  try {
    const { db } = await connectToDatabase();
    const combo = await db.collection("combos").findOne({
      slug,
      isActive: { $ne: false },
    });

    if (!combo) return null;
    return {
      ...combo,
      _id: combo._id.toString(),
    };
  } catch (error) {
    console.error("dataService.getComboBySlug error:", error);
    return null;
  }
});
