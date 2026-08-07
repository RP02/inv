export type VendorOffer = {
  id: string;
  vendor: string;
  vendorSku?: string;
  unitPrice: number;
  currency: string;
  moq: number;
  shippingFlat: number;
  shippingPerUnit: number;
  leadDays?: number;
  url?: string;
  lastChecked?: string;
};

export type Item = {
  id: string;
  sku: string;
  name: string;
  category: string;
  imageUrl?: string;
  notes?: string;
  unit: string;
  preferredQty: number;
  offers: VendorOffer[];
};

export type Catalog = {
  items: Item[];
  fileName?: string;
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
