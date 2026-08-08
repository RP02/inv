import { useMemo, useState } from "react";
import { categoryName } from "../api/inventory";
import { useInventory } from "../context/InventoryContext";
import ItemCard from "./ItemCard";
import ItemDetail from "./ItemDetail";
import ProjectGate from "./ProjectGate";
import Toolbar from "./Toolbar";

export default function Dashboard() {
  const {
    catalog,
    selectedItemId,
    setSelectedItemId,
    hasProjectFolder,
    folderBootstrapping,
  } = useInventory();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>("All");

  const categoryOptions = useMemo(() => {
    return [
      { id: "All", name: "All" },
      ...[...catalog.categories].sort((a, b) => a.name.localeCompare(b.name)),
    ];
  }, [catalog.categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.items.filter((item) => {
      if (categoryId !== "All" && item.categoryId !== categoryId) {
        return false;
      }
      if (!q) {
        return true;
      }
      const hay = [
        item.sku,
        item.name,
        item.id,
        item.categoryId,
        categoryName(catalog, item.categoryId),
        item.notes,
        ...item.offers.map((o) => o.vendor),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [catalog, categoryId, query]);

  const selected = catalog.items.find((i) => i.id === selectedItemId) ?? null;

  if (folderBootstrapping) {
    return (
      <div className="project-gate">
        <div className="project-gate-card">
          <h1>inv</h1>
          <p>Reconnecting project folder…</p>
        </div>
      </div>
    );
  }

  if (!hasProjectFolder) {
    return <ProjectGate />;
  }

  return (
    <div className="app-shell">
      <Toolbar
        filterCategoryId={categoryId === "All" ? undefined : categoryId}
      />

      <div className="filters">
        <input
          className="search"
          type="search"
          placeholder="Search name, SKU, vendor…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="pills">
          {categoryOptions.map((c) => (
            <button
              key={c.id}
              type="button"
              className={c.id === categoryId ? "pill active" : "pill"}
              onClick={() => setCategoryId(c.id)}
              title={c.id === "All" ? "All categories" : c.id}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty">
          No items yet. Use Add Item to create one.
        </p>
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
        <ItemDetail
          item={selected}
          onClose={() => setSelectedItemId(null)}
          onNavigate={setSelectedItemId}
        />
      ) : null}
    </div>
  );
}
