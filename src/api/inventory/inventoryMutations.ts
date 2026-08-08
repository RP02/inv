import {
  DEFAULT_CURRENCY,
  DEFAULT_PREFERRED_QTY,
  DEFAULT_UNIT,
  UNCATEGORIZED_ID,
} from "./constants";
import { newId } from "./csvInventory";
import { categoryIdFromName } from "./slugs";
import { Catalog, Category, Item, VendorOffer } from "./types";

export function createEmptyItem(categoryId = UNCATEGORIZED_ID): Item {
  return {
    id: newId("item"),
    sku: "",
    name: "New item",
    categoryId,
    unit: DEFAULT_UNIT,
    preferredQty: DEFAULT_PREFERRED_QTY,
    offers: [createEmptyOffer()],
  };
}

export function createEmptyOffer(): VendorOffer {
  return {
    id: newId("offer"),
    vendor: "",
    unitPrice: 0,
    currency: DEFAULT_CURRENCY,
    moq: 1,
    shippingFlat: 0,
    shippingPerUnit: 0,
  };
}

export function upsertItem(catalog: Catalog, item: Item): Catalog {
  const idx = catalog.items.findIndex((i) => i.id === item.id);
  const items = [...catalog.items];
  if (idx >= 0) {
    items[idx] = item;
  } else {
    items.push(item);
  }
  return { ...catalog, items };
}

export function deleteItem(catalog: Catalog, itemId: string): Catalog {
  return {
    ...catalog,
    items: catalog.items.filter((i) => i.id !== itemId),
  };
}

export function updateItemFields(
  catalog: Catalog,
  itemId: string,
  patch: Partial<Item>
): Catalog {
  return {
    ...catalog,
    items: catalog.items.map((i) =>
      i.id === itemId ? { ...i, ...patch, id: i.id } : i
    ),
  };
}

export function upsertOffer(
  catalog: Catalog,
  itemId: string,
  offer: VendorOffer
): Catalog {
  return {
    ...catalog,
    items: catalog.items.map((item) => {
      if (item.id !== itemId) {
        return item;
      }
      const idx = item.offers.findIndex((o) => o.id === offer.id);
      const offers = [...item.offers];
      if (idx >= 0) {
        offers[idx] = offer;
      } else {
        offers.push(offer);
      }
      return { ...item, offers };
    }),
  };
}

export function deleteOffer(
  catalog: Catalog,
  itemId: string,
  offerId: string
): Catalog {
  return {
    ...catalog,
    items: catalog.items.map((item) => {
      if (item.id !== itemId) {
        return item;
      }
      return {
        ...item,
        offers: item.offers.filter((o) => o.id !== offerId),
      };
    }),
  };
}

export function addCategory(catalog: Catalog, name: string): Catalog {
  const trimmed = name.trim();
  if (!trimmed) {
    return catalog;
  }
  const id = categoryIdFromName(trimmed);
  if (catalog.categories.some((c) => c.id === id)) {
    // If id collision, keep unique with suffix
    const unique = `${id}_${Math.random().toString(36).slice(2, 6)}`;
    const cat: Category = { id: unique, name: trimmed };
    return { ...catalog, categories: [...catalog.categories, cat] };
  }
  if (
    catalog.categories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    )
  ) {
    return catalog;
  }
  return {
    ...catalog,
    categories: [...catalog.categories, { id, name: trimmed }],
  };
}

export function renameCategory(
  catalog: Catalog,
  categoryId: string,
  name: string
): Catalog {
  const trimmed = name.trim();
  if (!trimmed) {
    return catalog;
  }
  return {
    ...catalog,
    categories: catalog.categories.map((c) =>
      c.id === categoryId ? { ...c, name: trimmed } : c
    ),
  };
}

export function deleteCategory(
  catalog: Catalog,
  categoryId: string
): Catalog {
  if (categoryId === UNCATEGORIZED_ID) {
    return catalog;
  }
  return {
    ...catalog,
    categories: catalog.categories.filter((c) => c.id !== categoryId),
    items: catalog.items.map((item) =>
      item.categoryId === categoryId
        ? { ...item, categoryId: UNCATEGORIZED_ID }
        : item
    ),
  };
}
