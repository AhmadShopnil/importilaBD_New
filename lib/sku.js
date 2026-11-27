/**
 * Server-side SKU generator — single source of truth for variant identification.
 * Format: {DESIGN}-{COLOR}-{SIZE}  e.g. DT123-NAVY-BLUE-2Y
 */

function slugify(str) {
  return String(str)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Generate a human-readable, URL-safe SKU from designName + colorName + size.
 */
export function generateSKU(designName, colorName, size) {
  if (!colorName || !size) return ''
  const parts = []
  if (designName) parts.push(slugify(designName))
  parts.push(slugify(colorName))
  parts.push(slugify(size))
  return parts.join('-')
}

/**
 * Assign SKUs to an array of new variants.
 * Throws a descriptive Error if any variant is missing colorName/size or has a duplicate color+size.
 */
export function assignSKUs(variants, designName = '') {
  const seen = new Set()
  return variants.map((v, i) => {
    if (!v.colorName || !v.size) {
      throw new Error(`Variant #${i + 1} is missing colorName or size`)
    }
    const sku = generateSKU(designName, v.colorName, v.size)
    if (seen.has(sku)) {
      throw new Error(`Duplicate color+size combination: ${v.colorName} / ${v.size} → SKU "${sku}"`)
    }
    seen.add(sku)
    return { ...v, sku }
  })
}

/**
 * Assign SKUs on product update.
 * Preserves existing SKUs for unchanged color+size combinations (order history integrity).
 * Generates new SKUs for new variants.
 */
export function assignSKUsOnUpdate(newVariants, existingVariants = [], designName = '') {
  // Build a map: "COLORNAME|SIZE" -> existing sku
  const existingMap = new Map(
    existingVariants.map(v => [`${v.colorName}|${v.size}`, v.sku])
  )

  const seen = new Set()
  return newVariants.map((v, i) => {
    if (!v.colorName || !v.size) {
      throw new Error(`Variant #${i + 1} is missing colorName or size`)
    }
    // Reuse existing SKU if same color+size was already there
    const existingSku = existingMap.get(`${v.colorName}|${v.size}`)
    const sku = existingSku || generateSKU(designName, v.colorName, v.size)

    if (seen.has(sku)) {
      throw new Error(`Duplicate color+size combination: ${v.colorName} / ${v.size} → SKU "${sku}"`)
    }
    seen.add(sku)
    return { ...v, sku }
  })
}
