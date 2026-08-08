import {
  categoryName,
  formatMoney,
  getBestOffer,
  getItemDisplayImage,
} from "../api/inventory";
import { Item } from "../api/inventory/types";
import { useInventory } from "../context/InventoryContext";
import ResolvedImage from "./ResolvedImage";

type Props = {
  item: Item;
  onOpen: () => void;
};

export default function ItemCard({ item, onOpen }: Props) {
  const { catalog } = useInventory();
  const best = getBestOffer(item);
  const thumb = getItemDisplayImage(item);

  return (
    <button type="button" className="item-card" onClick={onOpen}>
      <div className="item-card-media">
        {thumb ? (
          <ResolvedImage imageUrl={thumb} alt="" />
        ) : (
          <span className="item-card-media-empty">No photo</span>
        )}
      </div>
      <div className="item-card-top">
        <span className="category">{categoryName(catalog, item.categoryId)}</span>
        <span className="sku">{item.sku}</span>
      </div>
      <div className="item-card-name">{item.name || "Untitled"}</div>
      <div className="item-card-meta">
        {item.offers.length} vendor{item.offers.length === 1 ? "" : "s"}
        {best ? (
          <>
            {" · best: "}
            <strong>{best.vendor}</strong>{" "}
            {formatMoney(best.unitPrice, best.currency)}/{item.unit}
          </>
        ) : (
          " · no offers"
        )}
      </div>
    </button>
  );
}
