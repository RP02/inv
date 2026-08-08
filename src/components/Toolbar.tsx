import { useState } from "react";
import { useInventory } from "../context/InventoryContext";
import CategoriesModal from "./CategoriesModal";

export default function Toolbar() {
  const {
    importCsv,
    saveCsv,
    addItem,
    openFolder,
    dirty,
    fileName,
    catalog,
    projectLabel,
    hasProjectFolder,
  } = useInventory();
  const [showCategories, setShowCategories] = useState(false);
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <header className="toolbar">
        <div className="toolbar-left">
          <h1>inv</h1>
          <span className="meta">
            {hasProjectFolder ? `${projectLabel}/` : ""}
            {fileName}
            {dirty ? " · unsaved" : " · saved"}
            {" · "}
            {catalog.items.length} items
            {!hasProjectFolder ? " · open folder on desktop for disk photos" : ""}
          </span>
        </div>
        <div className="toolbar-actions">
          <button type="button" className="btn-primary" onClick={addItem}>
            Add Item
          </button>
          <button type="button" onClick={() => void saveCsv()}>
            Save
          </button>
          <button type="button" onClick={() => setShowCategories(true)}>
            Categories
          </button>
          <button
            type="button"
            className="toolbar-more-toggle"
            aria-expanded={showMore}
            onClick={() => setShowMore((v) => !v)}
          >
            {showMore ? "Less" : "More"}
          </button>
          <div className={showMore ? "toolbar-more open" : "toolbar-more"}>
            <button type="button" onClick={() => void openFolder()}>
              Open folder
            </button>
            <button type="button" onClick={() => void importCsv()}>
              Import CSV
            </button>
          </div>
        </div>
      </header>
      {showCategories ? (
        <CategoriesModal onClose={() => setShowCategories(false)} />
      ) : null}
    </>
  );
}
