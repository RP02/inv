import { CSV_HEADERS, DEFAULT_CURRENCY, DEFAULT_PREFERRED_QTY, DEFAULT_UNIT } from "./constants";
import { CsvRows } from "./fileSystemCsv";
import { Catalog, Item, VendorOffer } from "./types";

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

/** Normalize one row per vendor offer into Item[]. */
export function parseCatalogFromRows(rows: string[][]): Catalog {
  if (rows.length < 2) {
    return { items: [] };
  }

  const idx = headerIndex(rows[0]);
  const bySku = new Map<string, Item>();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const sku = cell(row, idx, "sku");
    const name = cell(row, idx, "name");
    if (!sku && !name) {
      continue;
    }

    const key = sku || name;
    let item = bySku.get(key);
    if (!item) {
      item = {
        id: newId("item"),
        sku: sku || key,
        name: name || sku,
        category: cell(row, idx, "category") || "Uncategorized",
        imageUrl: cell(row, idx, "imageUrl") || undefined,
        notes: cell(row, idx, "notes") || undefined,
        unit: cell(row, idx, "unit") || DEFAULT_UNIT,
        preferredQty: num(cell(row, idx, "preferredQty"), DEFAULT_PREFERRED_QTY),
        offers: [],
      };
      bySku.set(key, item);
    }

    const vendor = cell(row, idx, "vendor");
    if (!vendor) {
      continue;
    }

    const offer: VendorOffer = {
      id: newId("offer"),
      vendor,
      vendorSku: cell(row, idx, "vendorSku") || undefined,
      unitPrice: num(cell(row, idx, "unitPrice"), 0),
      currency: cell(row, idx, "currency") || DEFAULT_CURRENCY,
      moq: Math.max(1, num(cell(row, idx, "moq"), 1)),
      shippingFlat: num(cell(row, idx, "shippingFlat"), 0),
      shippingPerUnit: num(cell(row, idx, "shippingPerUnit"), 0),
      leadDays: cell(row, idx, "leadDays")
        ? num(cell(row, idx, "leadDays"), 0)
        : undefined,
      url: cell(row, idx, "url") || undefined,
      lastChecked: cell(row, idx, "lastChecked") || undefined,
    };
    item.offers.push(offer);
  }

  return { items: Array.from(bySku.values()) };
}

export function catalogToRows(catalog: Catalog): CsvRows {
  const rows: CsvRows = [CSV_HEADERS.slice()];

  for (const item of catalog.items) {
    if (item.offers.length === 0) {
      rows.push([
        item.sku,
        item.name,
        item.category,
        item.imageUrl ?? "",
        item.notes ?? "",
        item.unit,
        item.preferredQty,
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
      ]);
      continue;
    }

    for (const offer of item.offers) {
      rows.push([
        item.sku,
        item.name,
        item.category,
        item.imageUrl ?? "",
        item.notes ?? "",
        item.unit,
        item.preferredQty,
        offer.vendor,
        offer.vendorSku ?? "",
        offer.unitPrice,
        offer.currency,
        offer.moq,
        offer.shippingFlat,
        offer.shippingPerUnit,
        offer.leadDays ?? "",
        offer.url ?? "",
        offer.lastChecked ?? "",
      ]);
    }
  }

  return rows;
}

export { newId };
