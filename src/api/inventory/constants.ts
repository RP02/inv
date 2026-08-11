/** Bump when clearing old cached sample catalogs from browsers. */
export const STORAGE_KEY = "inv.catalog.v4";
export const DEFAULT_CURRENCY = "CAD";
export const DEFAULT_UNIT = "ea";
export const DEFAULT_UNITS = 1;
export const UNCATEGORIZED_ID = "cat_uncategorized";
export const UNCATEGORIZED_NAME = "Uncategorized";
export const IMAGES_DIR = "images";
export const DEFAULT_INVENTORY_FILE = "inventory.csv";
export const DEFAULT_CATEGORIES_FILE = "categories.csv";

export const INVENTORY_CSV_HEADERS = [
  "itemId",
  "sku",
  "name",
  "categoryId",
  "primaryImageUrl",
  "notes",
  "unit",
  "vendor",
  "vendorSku",
  "imageUrl",
  "totalPrice",
  "units",
  "currency",
  "vendorNotes",
  "leadDays",
  "url",
  "lastChecked",
] as const;

export const CATEGORY_CSV_HEADERS = ["id", "name"] as const;
