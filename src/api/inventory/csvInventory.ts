import {
  CATEGORY_CSV_HEADERS,
  DEFAULT_CURRENCY,
  DEFAULT_PREFERRED_QTY,
  DEFAULT_UNIT,
  INVENTORY_CSV_HEADERS,
  UNCATEGORIZED_ID,
  UNCATEGORIZED_NAME,
} from "./constants";
import { CsvRows } from "./fileSystemCsv";
import { categoryIdFromName } from "./slugs";
import { Catalog, Category, Item, VendorOffer } from "./types";

function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function num(v: string | undefined, fallback = 0): number {
  if (v === undefined || v === "") {
    return fallback;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v: string | undefined): string {
  return (v ?? "").trim();
}

function headerIndex(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((h, i) => {
    map[h.trim().toLowerCase()] = i;
  });
  return map;
}

function cell(row: string[], idx: Record<string, number>, key: string): string {
  const i = idx[key.toLowerCase()];
  if (i === undefined) {
    return "";
  }
  return str(row[i]);
}

export function ensureUncategorized(categories: Category[]): Category[] {
  if (categories.some((c) => c.id === UNCATEGORIZED_ID)) {
    return categories;
  }
  return [{ id: UNCATEGORIZED_ID, name: UNCATEGORIZED_NAME }, ...categories];
}

/** Fresh catalog with only the default Uncategorized category. */
export function createEmptyCatalog(): Catalog {
  return {
    categories: ensureUncategorized([]),
    items: [],
    fileName: "inventory.csv",
    categoriesFileName: "categories.csv",
  };
}

export function parseCategoriesFromRows(rows: string[][]): Category[] {
  if (rows.length < 2) {
    return ensureUncategorized([]);
  }
  const idx = headerIndex(rows[0]);
  const cats: Category[] = [];
  const seen = new Set<string>();

  for (let r = 1; r < rows.length; r++) {
    const id = cell(rows[r], idx, "id") || cell(rows[r], idx, "categoryId");
    const name = cell(rows[r], idx, "name") || cell(rows[r], idx, "category");
    if (!id && !name) {
      continue;
    }
    const catId = id || categoryIdFromName(name);
    if (seen.has(catId)) {
      continue;
    }
    seen.add(catId);
    cats.push({ id: catId, name: name || catId });
  }

  return ensureUncategorized(cats);
}

export function categoriesToRows(categories: Category[]): CsvRows {
  const rows: CsvRows = [CATEGORY_CSV_HEADERS.slice()];
  for (const c of categories) {
    rows.push([c.id, c.name]);
  }
  return rows;
}

function resolveCategoryId(
  row: string[],
  idx: Record<string, number>,
  categoryByName: Map<string, string>,
  categoriesOut: Category[]
): string {
  const explicitId = cell(row, idx, "categoryId");
  if (explicitId) {
    if (!categoriesOut.some((c) => c.id === explicitId)) {
      const legacyName = cell(row, idx, "category");
      categoriesOut.push({
        id: explicitId,
        name: legacyName || explicitId,
      });
      categoryByName.set((legacyName || explicitId).toLowerCase(), explicitId);
    }
    return explicitId;
  }

  const legacyName = cell(row, idx, "category") || UNCATEGORIZED_NAME;
  const key = legacyName.toLowerCase();
  const existing = categoryByName.get(key);
  if (existing) {
    return existing;
  }
  const id = categoryIdFromName(legacyName);
  categoriesOut.push({ id, name: legacyName });
  categoryByName.set(key, id);
  return id;
}

/** Parse inventory rows; optionally merge with known categories. */
export function parseCatalogFromRows(
  rows: string[][],
  existingCategories: Category[] = []
): Catalog {
  const categories = ensureUncategorized([...existingCategories]);
  const categoryByName = new Map(
    categories.map((c) => [c.name.toLowerCase(), c.id])
  );

  if (rows.length < 2) {
    return { categories, items: [] };
  }

  const idx = headerIndex(rows[0]);
  const byItemKey = new Map<string, Item>();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const sku = cell(row, idx, "sku");
    const name = cell(row, idx, "name");
    if (!sku && !name) {
      continue;
    }

    const itemId = cell(row, idx, "itemId") || cell(row, idx, "id");
    const key = itemId || sku || name;
    let item = byItemKey.get(key);
    if (!item) {
      item = {
        id: itemId || newId("item"),
        sku: sku || key,
        name: name || sku,
        categoryId: resolveCategoryId(row, idx, categoryByName, categories),
        primaryImageUrl:
          cell(row, idx, "primaryImageUrl") ||
          cell(row, idx, "primaryImage") ||
          undefined,
        notes: cell(row, idx, "notes") || undefined,
        unit: cell(row, idx, "unit") || DEFAULT_UNIT,
        preferredQty: num(cell(row, idx, "preferredQty"), DEFAULT_PREFERRED_QTY),
        offers: [],
      };
      byItemKey.set(key, item);
    } else if (!item.primaryImageUrl) {
      const primary =
        cell(row, idx, "primaryImageUrl") || cell(row, idx, "primaryImage");
      if (primary) {
        item.primaryImageUrl = primary;
      }
    }

    const vendor = cell(row, idx, "vendor");
    if (!vendor) {
      continue;
    }

    const offer: VendorOffer = {
      id: newId("offer"),
      vendor,
      vendorSku: cell(row, idx, "vendorSku") || undefined,
      imageUrl:
        cell(row, idx, "imageUrl") ||
        cell(row, idx, "imagePath") ||
        undefined,
      unitPrice: num(cell(row, idx, "unitPrice"), 0),
      currency: cell(row, idx, "currency") || DEFAULT_CURRENCY,
      moq: Math.max(1, num(cell(row, idx, "moq"), 1)),
      shippingFlat: num(cell(row, idx, "shippingFlat"), 0),
      shippingPerUnit: num(cell(row, idx, "shippingPerUnit"), 0),
      notes:
        cell(row, idx, "vendorNotes") ||
        cell(row, idx, "offerNotes") ||
        undefined,
      leadDays: cell(row, idx, "leadDays")
        ? num(cell(row, idx, "leadDays"), 0)
        : undefined,
      url: cell(row, idx, "url") || undefined,
      lastChecked: cell(row, idx, "lastChecked") || undefined,
    };
    item.offers.push(offer);
  }

  return {
    categories: ensureUncategorized(categories),
    items: Array.from(byItemKey.values()),
  };
}

export function catalogToRows(catalog: Catalog): CsvRows {
  const rows: CsvRows = [INVENTORY_CSV_HEADERS.slice()];

  for (const item of catalog.items) {
    if (item.offers.length === 0) {
      rows.push([
        item.id,
        item.sku,
        item.name,
        item.categoryId,
        item.primaryImageUrl ?? "",
        item.notes ?? "",
        item.unit,
        item.preferredQty,
        "",
        "",
        "",
        "",
        DEFAULT_CURRENCY,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]);
      continue;
    }

    for (const offer of item.offers) {
      rows.push([
        item.id,
        item.sku,
        item.name,
        item.categoryId,
        item.primaryImageUrl ?? "",
        item.notes ?? "",
        item.unit,
        item.preferredQty,
        offer.vendor,
        offer.vendorSku ?? "",
        offer.imageUrl ?? "",
        offer.unitPrice,
        offer.currency || DEFAULT_CURRENCY,
        offer.moq,
        offer.shippingFlat,
        offer.shippingPerUnit,
        offer.notes ?? "",
        offer.leadDays ?? "",
        offer.url ?? "",
        offer.lastChecked ?? "",
      ]);
    }
  }

  return rows;
}

export function categoryName(
  catalog: Catalog,
  categoryId: string
): string {
  return (
    catalog.categories.find((c) => c.id === categoryId)?.name ??
    categoryId ??
    UNCATEGORIZED_NAME
  );
}

export { newId };
