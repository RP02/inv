/** Safe folder / file segment: lowercase, alphanumerics and single dashes. */
export function slugify(input: string, fallback = "x"): string {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return s || fallback;
}

export function categoryIdFromName(name: string): string {
  return `cat_${slugify(name, "category")}`;
}

export function vendorFileBase(vendor: string, offerId: string): string {
  const slug = slugify(vendor, "");
  return slug || slugify(offerId, "vendor");
}

/** images/{categoryId}/{itemId}/{vendorSlug}.jpg */
export function relativeVendorImagePath(
  categoryId: string,
  itemId: string,
  vendor: string,
  offerId: string,
  ext = "jpg"
): string {
  const file = `${vendorFileBase(vendor, offerId)}.${ext.replace(/^\./, "")}`;
  return `images/${categoryId}/${itemId}/${file}`;
}

/** images/{categoryId}/{itemId}/_primary.jpg — catalog face, not a vendor photo */
export function relativePrimaryImagePath(
  categoryId: string,
  itemId: string,
  ext = "jpg"
): string {
  return `images/${categoryId}/${itemId}/_primary.${ext.replace(/^\./, "")}`;
}
