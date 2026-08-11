import { STORAGE_KEY } from "./constants";
import { ensureUncategorized, normalizeItem } from "./csvInventory";
import { Catalog } from "./types";

export function loadCatalogFromStorage(): Catalog | null {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem("inv.catalog.v3");
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Catalog;
    if (!parsed || !Array.isArray(parsed.items)) {
      return null;
    }
    return {
      ...parsed,
      categories: ensureUncategorized(parsed.categories ?? []),
      items: parsed.items.map((item) =>
        normalizeItem({
          ...item,
          // migrate old catalogs that used category: string
          categoryId:
            item.categoryId ||
            (item as { category?: string }).category ||
            "cat_uncategorized",
        })
      ),
    };
  } catch {
    return null;
  }
}

export function saveCatalogToStorage(catalog: Catalog): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
  } catch (err) {
    console.warn("Failed to write localStorage cache", err);
  }
}

export function clearCatalogStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("inv.catalog.v3");
}
