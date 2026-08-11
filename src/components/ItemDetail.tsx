import { useEffect, useMemo, useState } from "react";
import { categoryName } from "../api/inventory";
import { Item } from "../api/inventory/types";
import { useInventory } from "../context/InventoryContext";
import {
  IconChevronLeft,
  IconChevronRight,
  IconItemDetails,
  IconTrash,
  IconX,
} from "./Icons";
import PrimaryImagePanel from "./PrimaryImagePanel";
import { selectOnFocus } from "./selectOnFocus";
import VendorComparisonTable from "./VendorComparisonTable";

type Props = {
  item: Item;
  onClose: () => void;
  onNavigate: (itemId: string) => void;
};

export default function ItemDetail({ item, onClose, onNavigate }: Props) {
  const {
    catalog,
    patchItem,
    changeItemCategory,
    removeItem,
    addOffer,
    saveOffer,
    removeOffer,
  } = useInventory();

  const siblings = useMemo(() => {
    return catalog.items
      .filter((i) => i.categoryId === item.categoryId)
      .slice()
      .sort((a, b) => {
        const byName = a.name.localeCompare(b.name, undefined, {
          sensitivity: "base",
        });
        if (byName !== 0) {
          return byName;
        }
        return a.sku.localeCompare(b.sku);
      });
  }, [catalog.items, item.categoryId]);

  const index = siblings.findIndex((i) => i.id === item.id);
  const pos = index >= 0 ? index + 1 : 0;
  const prev = index > 0 ? siblings[index - 1] : undefined;
  const next =
    index >= 0 && index < siblings.length - 1
      ? siblings[index + 1]
      : undefined;
  const catLabel = categoryName(catalog, item.categoryId);
  /** Mobile: hide product fields by default so vendors get the screen. */
  const [showItemDetails, setShowItemDetails] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft" && prev) {
        e.preventDefault();
        onNavigate(prev.id);
      } else if (e.key === "ArrowRight" && next) {
        e.preventDefault();
        onNavigate(next.id);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, onNavigate, onClose]);

  return (
    <div className="detail-overlay" role="dialog" aria-modal="true">
      <div className="detail-panel">
        <div className="detail-header">
          <div>
            <h2>{item.name || "Untitled item"}</h2>
            <div className="detail-nav-cat" title={catLabel}>
              {catLabel}
              {siblings.length > 0
                ? ` · ${pos} of ${siblings.length} in category`
                : ""}
            </div>
          </div>
          <div className="detail-header-actions">
            <div className="detail-nav">
              <button
                type="button"
                className="icon-btn"
                disabled={!prev}
                onClick={() => prev && onNavigate(prev.id)}
                title="Previous in category (←)"
                aria-label="Previous"
              >
                <IconChevronLeft />
              </button>
              <span className="detail-nav-pos">
                {pos}/{siblings.length || 0}
              </span>
              <button
                type="button"
                className="icon-btn"
                disabled={!next}
                onClick={() => next && onNavigate(next.id)}
                title="Next in category (→)"
                aria-label="Next"
              >
                <IconChevronRight />
              </button>
            </div>
            <button
              type="button"
              className={
                showItemDetails
                  ? "icon-btn detail-mobile-toggle active"
                  : "icon-btn detail-mobile-toggle"
              }
              title={
                showItemDetails ? "Hide item details" : "Show item details"
              }
              aria-label={
                showItemDetails ? "Hide item details" : "Show item details"
              }
              aria-pressed={showItemDetails}
              onClick={() => setShowItemDetails((v) => !v)}
            >
              <IconItemDetails />
            </button>
            <button
              type="button"
              className="icon-btn danger"
              title="Delete item"
              aria-label="Delete item"
              onClick={() => {
                if (confirm(`Delete ${item.name || item.sku}?`)) {
                  removeItem(item.id);
                  onClose();
                }
              }}
            >
              <IconTrash />
            </button>
            <button
              type="button"
              className="icon-btn"
              title="Close"
              aria-label="Close"
              onClick={onClose}
            >
              <IconX />
            </button>
          </div>
        </div>

        <div
          className={
            showItemDetails
              ? "detail-body"
              : "detail-body vendors-focus"
          }
        >
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
                onFocus={selectOnFocus}
                onChange={(e) => patchItem(item.id, { sku: e.target.value })}
              />
            </label>
            <label>
              Name
              <input
                type="text"
                value={item.name}
                onFocus={selectOnFocus}
                onChange={(e) => patchItem(item.id, { name: e.target.value })}
              />
            </label>
            <label>
              Category
              <select
                value={item.categoryId}
                onChange={(e) =>
                  void changeItemCategory(item.id, e.target.value)
                }
              >
                {catalog.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="field-hint">
                id: {item.categoryId} ({catLabel})
              </span>
            </label>

            <PrimaryImagePanel item={item} />

            <label>
              Unit
              <input
                type="text"
                value={item.unit}
                onFocus={selectOnFocus}
                onChange={(e) => patchItem(item.id, { unit: e.target.value })}
              />
            </label>
            <label>
              Notes
              <textarea
                rows={3}
                value={item.notes ?? ""}
                onFocus={selectOnFocus}
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
              onRemoveOffer={(offerId) => void removeOffer(item.id, offerId)}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
