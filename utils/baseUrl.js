
export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  (typeof window !== "undefined" ? "" : "http://localhost:3000");

