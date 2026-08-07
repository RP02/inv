import { formatMoney, getBestOffer } from "../api/inventory";
import { Item } from "../api/inventory/types";

type Props = {
  item: Item;
  onOpen: () => void;
};

export default function ItemCard({ item, onOpen }: Props) {
  const best = getBestOffer(item);

  return (
    <button type="button" className="item-card" onClick={onOpen}>
      <div className="item-card-top">
        <span className="category">{item.category}</span>
        <span className="sku">{item.sku}</span>
      </div>
      <div className="item-card-name">{item.name}</div>
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
