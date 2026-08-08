import { useEffect, useRef, useState } from "react";
import { useInventory } from "../context/InventoryContext";
import CategoriesModal from "./CategoriesModal";
import {
  IconFolder,
  IconInfo,
  IconMore,
  IconPlus,
  IconSave,
  IconTags,
} from "./Icons";

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
  const [showInfo, setShowInfo] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showInfo && !showMore) {
      return;
    }
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (showInfo && !infoRef.current?.contains(t)) {
        setShowInfo(false);
      }
      if (showMore && !moreRef.current?.contains(t)) {
        setShowMore(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowInfo(false);
        setShowMore(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [showInfo, showMore]);

  return (
    <>
      <header className="toolbar">
        <div className="toolbar-left">
          <div className="toolbar-brand">
            <h1>inv</h1>
            <span
              className={dirty ? "csv-status unsaved" : "csv-status saved"}
              title={
                dirty
                  ? "Inventory/categories CSV not saved yet"
                  : "Inventory/categories CSV saved to project folder"
              }
            >
              {dirty ? "CSV unsaved" : "CSV saved"}
            </span>
            <div className="project-info" ref={infoRef}>
              <button
                type="button"
                className="icon-btn project-info-btn"
                title="Project folder details"
                aria-label="Project folder details"
                aria-expanded={showInfo}
                aria-haspopup="dialog"
                onClick={() => {
                  setShowMore(false);
                  setShowInfo((v) => !v);
                }}
              >
                <IconInfo size={18} />
              </button>
              {showInfo ? (
                <div className="project-info-popover" role="dialog">
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
                  <p className="project-info-note">
                    Photos write to disk immediately. CSV updates only when you
                    Save (Ctrl/Cmd+S).
                  </p>
                  <p className="project-info-counts">
                    {catalog.items.length} item
                    {catalog.items.length === 1 ? "" : "s"}
                    {" · "}
                    {catalog.categories.length} categor
                    {catalog.categories.length === 1 ? "y" : "ies"}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="toolbar-actions">
          <button
            type="button"
            className="icon-btn accent"
            title="Add item"
            aria-label="Add item"
            onClick={() => addItem(filterCategoryId)}
          >
            <IconPlus size={18} />
          </button>
          <button
            type="button"
            className={dirty ? "icon-btn btn-save-dirty" : "icon-btn"}
            title={dirty ? "Save CSV* (Ctrl/Cmd+S)" : "Save CSV (Ctrl/Cmd+S)"}
            aria-label={dirty ? "Save CSV (unsaved changes)" : "Save CSV"}
            onClick={() => void saveCsv()}
          >
            <IconSave size={18} />
            {dirty ? <span className="save-dirty-dot" aria-hidden /> : null}
          </button>
          <div className="toolbar-overflow" ref={moreRef}>
            <button
              type="button"
              className="icon-btn"
              title="More actions"
              aria-label="More actions"
              aria-expanded={showMore}
              aria-haspopup="menu"
              onClick={() => {
                setShowInfo(false);
                setShowMore((v) => !v);
              }}
            >
              <IconMore size={18} />
            </button>
            {showMore ? (
              <div className="toolbar-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowMore(false);
                    setShowCategories(true);
                  }}
                >
                  <IconTags size={16} /> Categories
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowMore(false);
                    void openFolder();
                  }}
                >
                  <IconFolder size={16} /> Switch folder
                </button>
              </div>
            ) : null}
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
