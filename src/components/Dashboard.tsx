import { useMemo, useState } from "react";
import { useInventory } from "../context/InventoryContext";
import ItemCard from "./ItemCard";
import ItemDetail from "./ItemDetail";
import Toolbar from "./Toolbar";

export default function Dashboard() {
  const { catalog, selectedItemId, setSelectedItemId } = useInventory();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");

  const categories = useMemo(() => {
    const set = new Set(catalog.items.map((i) => i.category || "Uncategorized"));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [catalog.items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.items.filter((item) => {
      if (category !== "All" && item.category !== category) {
        return false;
      }
      if (!q) {
        return true;
      }
      const hay = [
        item.sku,
        item.name,
        item.category,
        item.notes,
        ...item.offers.map((o) => o.vendor),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [catalog.items, category, query]);

  const selected = catalog.items.find((i) => i.id === selectedItemId) ?? null;

  return (
    <div className="app-shell">
      <Toolbar />

      <div className="filters">
        <input
          className="search"
          type="search"
          placeholder="Search name, SKU, vendor…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="pills">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={c === category ? "pill active" : "pill"}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty">No items match. Import a CSV or add an item.</p>
      ) : (
        <div className="item-grid">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onOpen={() => setSelectedItemId(item.id)}
            />
          ))}
        </div>
      )}

      {selected ? (
        <ItemDetail item={selected} onClose={() => setSelectedItemId(null)} />
      ) : null}
    </div>
  );
}
