import { Item, OfferCost, VendorOffer } from "./types";

/** orderQty = max(preferredQty, moq); shipping = flat + perUnit * orderQty */
export function computeOfferCost(
  offer: VendorOffer,
  preferredQty: number
): Omit<OfferCost, "isBestValue"> {
  const qty = Math.max(1, preferredQty || 1);
  const moq = Math.max(1, offer.moq || 1);
  const orderQty = Math.max(qty, moq);
  const goodsTotal = orderQty * (offer.unitPrice || 0);
  const shippingTotal =
    (offer.shippingFlat || 0) + orderQty * (offer.shippingPerUnit || 0);
  const effectiveTotal = goodsTotal + shippingTotal;
  const effectivePerUnit = orderQty > 0 ? effectiveTotal / orderQty : 0;

  return {
    offerId: offer.id,
    orderQty,
    goodsTotal,
    shippingTotal,
    effectiveTotal,
    effectivePerUnit,
  };
}

export function computeItemCosts(item: Item): OfferCost[] {
  const base = item.offers.map((o) => computeOfferCost(o, item.preferredQty));
  if (base.length === 0) {
    return [];
  }

  const best = Math.min(...base.map((c) => c.effectivePerUnit));
  return base.map((c) => ({
    ...c,
    isBestValue: c.effectivePerUnit === best,
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

export function formatMoney(n: number, currency = "USD"): string {
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
