export const STORAGE_KEY = "inv.catalog.v1";
export const DEFAULT_CURRENCY = "USD";
export const DEFAULT_UNIT = "ea";
export const DEFAULT_PREFERRED_QTY = 1;

export const CSV_HEADERS = [
  "sku",
  "name",
  "category",
  "imageUrl",
  "notes",
  "unit",
  "preferredQty",
  "vendor",
  "vendorSku",
  "unitPrice",
  "currency",
  "moq",
  "shippingFlat",
  "shippingPerUnit",
  "leadDays",
  "url",
  "lastChecked",
] as const;
