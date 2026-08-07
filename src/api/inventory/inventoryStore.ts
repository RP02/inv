import { STORAGE_KEY } from "./constants";
import { Catalog } from "./types";

export function loadCatalogFromStorage(): Catalog | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Catalog;
    if (!parsed || !Array.isArray(parsed.items)) {
      return null;
    }
    return parsed;
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
}
