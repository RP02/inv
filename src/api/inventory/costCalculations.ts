import { Item, OfferCost, VendorOffer } from "./types";

/** unitPrice = totalPrice / units */
export function unitPriceOf(offer: VendorOffer): number {
  const units = Math.max(0, offer.units || 0);
  if (units <= 0) {
    return 0;
  }
  return (offer.totalPrice || 0) / units;
}

export function computeOfferCost(
  offer: VendorOffer
): Omit<OfferCost, "isBestValue"> {
  const units = Math.max(0, offer.units || 0);
  const totalPrice = offer.totalPrice || 0;
  return {
    offerId: offer.id,
    units,
    totalPrice,
    unitPrice: units > 0 ? totalPrice / units : 0,
  };
}

export function computeItemCosts(item: Item): OfferCost[] {
  const base = item.offers.map((o) => computeOfferCost(o));
  if (base.length === 0) {
    return [];
  }

  const best = Math.min(...base.map((c) => c.unitPrice));
  return base.map((c) => ({
    ...c,
    isBestValue: c.unitPrice === best,
  }));
}

export function getBestOffer(item: Item): VendorOffer | undefined {
  const costs = computeItemCosts(item);
  const best = costs.find((c) => c.isBestValue);
  if (!best) {
    return undefined;
  }
  return item.offers.find((o) => o.id === best.offerId);
}

export function formatMoney(n: number, currency = "CAD"): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 4,
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}
