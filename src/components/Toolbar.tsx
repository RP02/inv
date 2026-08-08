import { useState } from "react";
import { useInventory } from "../context/InventoryContext";
import CategoriesModal from "./CategoriesModal";

type Props = {
  /** Active list filter category; used as default when adding an item. */
  filterCategoryId?: string;
};

export default function Toolbar({ filterCategoryId }: Props) {
  const {
    saveCsv,
    addItem,
    openFolder,
    dirty,
    fileName,
    categoriesFileName,
    catalog,
    projectLabel,
    saveNotice,
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
              {dirty ? "CSV unsaved" : "CSV saved"}
              {" · Photos write to disk immediately"}
              {" · "}
              {catalog.items.length} item
              {catalog.items.length === 1 ? "" : "s"}
              {" · "}
              {catalog.categories.length} categor
              {catalog.categories.length === 1 ? "y" : "ies"}
            </div>
          </div>
        </div>
        <div className="toolbar-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => addItem(filterCategoryId)}
          >
            Add Item
          </button>
          <button
            type="button"
            className={dirty ? "btn-save-dirty" : undefined}
            onClick={() => void saveCsv()}
            title="Save CSV (Ctrl/Cmd+S)"
          >
            {dirty ? "Save CSV*" : "Save CSV"}
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
          </div>
        </div>
      </header>
      {saveNotice ? (
        <div className="save-toast" role="status">
          {saveNotice}
        </div>
      ) : null}
      {showCategories ? (
        <CategoriesModal onClose={() => setShowCategories(false)} />
      ) : null}
    </>
  );
}
