import { computeItemCosts, formatMoney } from "../api/inventory";
import { Item, VendorOffer } from "../api/inventory/types";
import VendorImageCell from "./VendorImageCell";

type Props = {
  item: Item;
  onChangeOffer: (offer: VendorOffer) => void;
  onAddOffer: () => void;
  onRemoveOffer: (offerId: string) => void;
};

function numInput(
  value: number,
  onChange: (n: number) => void,
  step = "0.01"
) {
  return (
    <input
      type="number"
      step={step}
      min={0}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

export default function VendorComparisonTable({
  item,
  onChangeOffer,
  onAddOffer,
  onRemoveOffer,
}: Props) {
  const costs = computeItemCosts(item);
  const costById = new Map(costs.map((c) => [c.offerId, c]));

  return (
    <div className="vendor-table-wrap">
      <div className="vendor-table-head">
        <h3>Vendor comparison</h3>
        <button type="button" onClick={onAddOffer}>
          Add vendor
        </button>
      </div>
      <p className="hint">
        Photos save under{" "}
        <code>
          images/{item.categoryId}/{item.id}/
        </code>{" "}
        when a project folder is open.
      </p>
      <table className="vendor-table">
        <thead>
          <tr>
            <th>Photo</th>
            <th>Vendor</th>
            <th>Unit price</th>
            <th>MOQ</th>
            <th>Ship flat</th>
            <th>Ship / unit</th>
            <th>Order qty</th>
            <th>Total</th>
            <th>$ / unit</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {item.offers.length === 0 ? (
            <tr>
              <td colSpan={10}>No vendor offers yet.</td>
            </tr>
          ) : (
            item.offers.map((offer) => {
              const cost = costById.get(offer.id);
              return (
                <tr
                  key={offer.id}
                  className={cost?.isBestValue ? "best-value" : undefined}
                >
                  <td>
                    <VendorImageCell
                      item={item}
                      offer={offer}
                      onChange={onChangeOffer}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={offer.vendor}
                      placeholder="Vendor"
                      onChange={(e) =>
                        onChangeOffer({ ...offer, vendor: e.target.value })
                      }
                    />
                    {cost?.isBestValue ? (
                      <span className="badge">Best value</span>
                    ) : null}
                  </td>
                  <td>
                    {numInput(offer.unitPrice, (unitPrice) =>
                      onChangeOffer({ ...offer, unitPrice })
                    )}
                  </td>
                  <td>
                    {numInput(
                      offer.moq,
                      (moq) => onChangeOffer({ ...offer, moq }),
                      "1"
                    )}
                  </td>
                  <td>
                    {numInput(offer.shippingFlat, (shippingFlat) =>
                      onChangeOffer({ ...offer, shippingFlat })
                    )}
                  </td>
                  <td>
                    {numInput(offer.shippingPerUnit, (shippingPerUnit) =>
                      onChangeOffer({ ...offer, shippingPerUnit })
                    )}
                  </td>
                  <td>{cost?.orderQty ?? "—"}</td>
                  <td>
                    {cost
                      ? formatMoney(cost.effectiveTotal, offer.currency)
                      : "—"}
                  </td>
                  <td>
                    {cost
                      ? formatMoney(cost.effectivePerUnit, offer.currency)
                      : "—"}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => onRemoveOffer(offer.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
