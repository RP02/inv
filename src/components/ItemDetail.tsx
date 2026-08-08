import { categoryName } from "../api/inventory";
import { Item } from "../api/inventory/types";
import { useInventory } from "../context/InventoryContext";
import PrimaryImagePanel from "./PrimaryImagePanel";
import VendorComparisonTable from "./VendorComparisonTable";

type Props = {
  item: Item;
  onClose: () => void;
};

export default function ItemDetail({ item, onClose }: Props) {
  const { catalog, patchItem, removeItem, addOffer, saveOffer, removeOffer } =
    useInventory();

  return (
    <div className="detail-overlay" role="dialog" aria-modal="true">
      <div className="detail-panel">
        <div className="detail-header">
          <h2>{item.name || "Untitled item"}</h2>
          <div className="detail-header-actions">
            <button
              type="button"
              className="danger"
              onClick={() => {
                if (confirm(`Delete ${item.name || item.sku}?`)) {
                  removeItem(item.id);
                  onClose();
                }
              }}
            >
              Delete item
            </button>
            <button type="button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="detail-body">
          <section className="product-panel">
            <label>
              Item id
              <input type="text" value={item.id} readOnly />
            </label>
            <label>
              SKU
              <input
                type="text"
                value={item.sku}
                onChange={(e) => patchItem(item.id, { sku: e.target.value })}
              />
            </label>
            <label>
              Name
              <input
                type="text"
                value={item.name}
                onChange={(e) => patchItem(item.id, { name: e.target.value })}
              />
            </label>
            <label>
              Category
              <select
                value={item.categoryId}
                onChange={(e) =>
                  patchItem(item.id, { categoryId: e.target.value })
                }
              >
                {catalog.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="field-hint">
                id: {item.categoryId} (
                {categoryName(catalog, item.categoryId)})
              </span>
            </label>

            <PrimaryImagePanel item={item} />

            <label>
              Unit
              <input
                type="text"
                value={item.unit}
                onChange={(e) => patchItem(item.id, { unit: e.target.value })}
              />
            </label>
            <label>
              Preferred qty
              <input
                type="number"
                min={1}
                step={1}
                value={item.preferredQty}
                onChange={(e) =>
                  patchItem(item.id, {
                    preferredQty: Math.max(1, Number(e.target.value) || 1),
                  })
                }
              />
            </label>
            <label>
              Notes
              <textarea
                rows={3}
                value={item.notes ?? ""}
                onChange={(e) =>
                  patchItem(item.id, { notes: e.target.value || undefined })
                }
              />
            </label>
          </section>

          <section className="comparison-panel">
            <VendorComparisonTable
              item={item}
              onChangeOffer={(offer) => saveOffer(item.id, offer)}
              onAddOffer={() => addOffer(item.id)}
              onRemoveOffer={(offerId) => removeOffer(item.id, offerId)}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
