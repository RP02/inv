/** Bump when clearing old cached sample catalogs from browsers. */
export const STORAGE_KEY = "inv.catalog.v3";
export const DEFAULT_CURRENCY = "CAD";
export const DEFAULT_UNIT = "ea";
export const DEFAULT_PREFERRED_QTY = 1;
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
  "preferredQty",
  "vendor",
  "vendorSku",
  "imageUrl",
  "unitPrice",
  "currency",
  "moq",
  "shippingFlat",
  "shippingPerUnit",
  "vendorNotes",
  "leadDays",
  "url",
  "lastChecked",
] as const;

export const CATEGORY_CSV_HEADERS = ["id", "name"] as const;
