import { computeItemCosts, formatMoney } from "../api/inventory";
import { Item, VendorOffer } from "../api/inventory/types";
import { IconPlus, IconTrash } from "./Icons";
import { selectOnFocus } from "./selectOnFocus";
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
  step = "0.01",
  className?: string
) {
  return (
    <input
      type="number"
      className={className}
      step={step}
      min={0}
      value={Number.isFinite(value) ? value : 0}
      onFocus={selectOnFocus}
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
        <h3>Vendors · CAD</h3>
        <button
          type="button"
          className="icon-btn accent"
          title="Add vendor"
          aria-label="Add vendor"
          onClick={onAddOffer}
        >
          <IconPlus size={18} />
        </button>
      </div>
      <table className="vendor-table dense">
        <thead>
          <tr>
            <th title="Photo" aria-label="Photo" />
            <th title="Vendor">Vendor</th>
            <th title="Total price">Total Price</th>
            <th title="Number of units">#units</th>
            <th title="Unit price (total ÷ units)">unit price</th>
            <th title="Notes">Notes</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {item.offers.length === 0 ? (
            <tr>
              <td colSpan={7}>No vendors yet — use + to add one.</td>
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
                      className="vendor-name-input"
                      value={offer.vendor}
                      onFocus={selectOnFocus}
                      onChange={(e) =>
                        onChangeOffer({ ...offer, vendor: e.target.value })
                      }
                    />
                    {cost?.isBestValue ? (
                      <span className="badge">Best</span>
                    ) : null}
                  </td>
                  <td>
                    {numInput(
                      offer.totalPrice,
                      (totalPrice) => onChangeOffer({ ...offer, totalPrice }),
                      "0.01",
                      "num-narrow"
                    )}
                  </td>
                  <td>
                    {numInput(
                      offer.units,
                      (units) =>
                        onChangeOffer({
                          ...offer,
                          units: Math.max(0, units),
                        }),
                      "1",
                      "num-narrow"
                    )}
                  </td>
                  <td className="num-readonly">
                    {cost
                      ? formatMoney(cost.unitPrice, offer.currency)
                      : "—"}
                  </td>
                  <td>
                    <input
                      type="text"
                      className="notes-input"
                      value={offer.notes ?? ""}
                      onFocus={selectOnFocus}
                      onChange={(e) =>
                        onChangeOffer({
                          ...offer,
                          notes: e.target.value || undefined,
                        })
                      }
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="icon-btn danger"
                      title="Remove vendor"
                      aria-label="Remove vendor"
                      onClick={() => onRemoveOffer(offer.id)}
                    >
                      <IconTrash size={16} />
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
