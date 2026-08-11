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
  /** Total price for the quoted quantity (CAD unless currency set). */
  totalPrice: number;
  /** Number of units in the quote. */
  units: number;
  currency: string;
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
  units: number;
  totalPrice: number;
  unitPrice: number;
  isBestValue: boolean;
};
