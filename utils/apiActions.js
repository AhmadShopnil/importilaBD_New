import {
  getStoreProducts,
  getStoreCombos,
  getSlidersByLocation,
} from "@/lib/dataService";

export async function getProducts() {
  return await getStoreProducts(20);
}

export async function getCombos() {
  return await getStoreCombos();
}

export async function getSliders(location) {
  return await getSlidersByLocation(location);
}
