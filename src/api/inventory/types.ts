export type Category = {
  id: string;
  name: string;
};

export type VendorOffer = {
  id: string;
  vendor: string;
  vendorSku?: string;
  /**
   * Relative path under project folder (images/{categoryId}/{itemId}/…),
   * or https URL / data URL fallback when no folder is open.
   */
  imageUrl?: string;
  unitPrice: number;
  currency: string;
  moq: number;
  shippingFlat: number;
  shippingPerUnit: number;
  /** Per-vendor notes (comparison table column). */
  notes?: string;
  leadDays?: number;
  url?: string;
  lastChecked?: string;
};

export type Item = {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  /** Optional catalog face photo (separate from vendor row photos). */
  primaryImageUrl?: string;
  notes?: string;
  unit: string;
  preferredQty: number;
  offers: VendorOffer[];
};

export type Catalog = {
  categories: Category[];
  items: Item[];
  fileName?: string;
  categoriesFileName?: string;
  projectName?: string;
};

export type OfferCost = {
  offerId: string;
  orderQty: number;
  goodsTotal: number;
  shippingTotal: number;
  effectiveTotal: number;
  effectivePerUnit: number;
  isBestValue: boolean;
};
