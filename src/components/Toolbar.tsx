import { useInventory } from "../context/InventoryContext";

export default function Toolbar() {
  const { importCsv, saveCsv, loadMock, addItem, dirty, fileName, catalog } =
    useInventory();

  return (
    <header className="toolbar">
      <div className="toolbar-left">
        <h1>inv</h1>
        <span className="meta">
          {fileName}
          {dirty ? " · unsaved" : " · saved"}
          {" · "}
          {catalog.items.length} items
        </span>
      </div>
      <div className="toolbar-actions">
        <button type="button" onClick={() => void importCsv()}>
          Import CSV
        </button>
        <button type="button" onClick={() => void saveCsv()}>
          Save CSV
        </button>
        <button type="button" onClick={addItem}>
          Add Item
        </button>
        <button type="button" className="secondary" onClick={loadMock}>
          Load sample
        </button>
      </div>
    </header>
  );
}
