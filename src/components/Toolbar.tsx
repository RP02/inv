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
    categoriesFileName,
    catalog,
    projectLabel,
  } = useInventory();
  const [showCategories, setShowCategories] = useState(false);
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <header className="toolbar">
        <div className="toolbar-left">
          <h1>inv</h1>
          <div
            className="project-path linked"
            title={`Saving to folder "${projectLabel}"`}
          >
            <div className="project-path-row">
              <span className="project-path-label">Project</span>
              <code className="project-path-value">{projectLabel}/</code>
            </div>
            <div className="project-path-row">
              <span className="project-path-label">Files</span>
              <code className="project-path-value">
                {projectLabel}/{fileName}
                {" · "}
                {projectLabel}/{categoriesFileName}
              </code>
            </div>
            <div className="project-path-meta">
              {dirty ? "Unsaved changes" : "Saved"}
              {" · "}
              {catalog.items.length} item
              {catalog.items.length === 1 ? "" : "s"}
              {" · "}
              {catalog.categories.length} categor
              {catalog.categories.length === 1 ? "y" : "ies"}
              {" · images/… on disk"}
            </div>
          </div>
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
              Switch folder
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
