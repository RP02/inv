import { CSV_HEADERS } from "./constants";
import { CsvRows } from "./fileSystemCsv";
import { Catalog, InventoryItem, VendorOffer } from "./types";

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
  return (row[i] ?? "").trim();
}

/** Parse normalized CSV (one row per vendor offer) into a catalog. */
export function catalogFromCsvRows(rows: string[][]): Catalog {
  if (rows.length === 0) {
    return { items: [] };
  }

  const idx = headerIndex(rows[0]);
  if (idx.sku === undefined || idx.vendor === undefined) {
    throw new Error(
      "CSV must include at least sku and vendor columns (header row required)."
    );
  }

  const bySku = new Map<string, InventoryItem>();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => !c?.trim())) {
      continue;
    }

    const sku = cell(row, idx, "sku");
    const vendor = cell(row, idx, "vendor");
    if (!sku || !vendor) {
      continue;
    }

    let item = bySku.get(sku);
    if (!item) {
      item = {
        id: newId("item"),
        sku,
        name: cell(row, idx, "name") || sku,
        category: cell(row, idx, "category") || "Uncategorized",
        imageUrl: cell(row, idx, "imageUrl") || undefined,
        notes: cell(row, idx, "notes") || undefined,
        unit: cell(row, idx, "unit") || "ea",
        preferredQty: num(cell(row, idx, "preferredQty"), 1),
        offers: [],
      };
      bySku.set(sku, item);
    } else {
      // Keep first non-empty item fields; allow later rows to fill blanks.
      if (!item.name && cell(row, idx, "name")) {
        item.name = cell(row, idx, "name");
      }
      if ((!item.category || item.category === "Uncategorized") && cell(row, idx, "category")) {
        item.category = cell(row, idx, "category");
      }
      if (!item.imageUrl && cell(row, idx, "imageUrl")) {
        item.imageUrl = cell(row, idx, "imageUrl");
      }
      if (!item.notes && cell(row, idx, "notes")) {
        item.notes = cell(row, idx, "notes");
      }
      if (item.unit === "ea" && cell(row, idx, "unit")) {
        item.unit = cell(row, idx, "unit");
      }
      const pq = cell(row, idx, "preferredQty");
      if (pq) {
        item.preferredQty = num(pq, item.preferredQty);
      }
    }

    const offer: VendorOffer = {
      id: newId("offer"),
      vendor,
      vendorSku: cell(row, idx, "vendorSku") || undefined,
      unitPrice: num(cell(row, idx, "unitPrice"), 0),
      moq: num(cell(row, idx, "moq"), 1),
      shippingFlat: num(cell(row, idx, "shippingFlat"), 0),
      shippingPerUnit: num(cell(row, idx, "shippingPerUnit"), 0),
      leadDays: cell(row, idx, "leadDays")
        ? num(cell(row, idx, "leadDays"))
        : undefined,
      url: cell(row, idx, "url") || undefined,
      lastChecked: cell(row, idx, "lastChecked") || undefined,
    };
    item.offers.push(offer);
  }

  return { items: Array.from(bySku.values()) };
}

export function catalogToCsvRows(catalog: Catalog): CsvRows {
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
        "",
        "",
        "",
        "",
        "",
        "",
      ]);
      continue;
    }
    for (const o of item.offers) {
      rows.push([
        item.sku,
        item.name,
        item.category,
        item.imageUrl ?? "",
        item.notes ?? "",
        item.unit,
        item.preferredQty,
        o.vendor,
        o.vendorSku ?? "",
        o.unitPrice,
        o.moq,
        o.shippingFlat,
        o.shippingPerUnit,
        o.leadDays ?? "",
        o.url ?? "",
        o.lastChecked ?? "",
      ]);
    }
  }
  return rows;
}

export function emptyItem(): InventoryItem {
  return {
    id: newId("item"),
    sku: "",
    name: "",
    category: "Uncategorized",
    unit: "ea",
    preferredQty: 1,
    offers: [
      {
        id: newId("offer"),
        vendor: "",
        unitPrice: 0,
        moq: 1,
        shippingFlat: 0,
        shippingPerUnit: 0,
      },
    ],
  };
}

export function emptyOffer(): VendorOffer {
  return {
    id: newId("offer"),
    vendor: "",
    unitPrice: 0,
    moq: 1,
    shippingFlat: 0,
    shippingPerUnit: 0,
  };
}
