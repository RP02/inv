import { isFileSystemAccessSupported } from "../api/inventory";
import { useInventory } from "../context/InventoryContext";

export default function ProjectGate() {
  const { openFolder } = useInventory();
  const supported = isFileSystemAccessSupported();

  return (
    <div className="project-gate">
      <div className="project-gate-card">
        <h1>inv</h1>
        <h2>Select a project folder to continue</h2>
        <p>
          All inventory data and photos are saved in one folder (for example in
          OneDrive). This avoids accidental downloads or edits that are not
          linked to your files.
        </p>
        <p className="project-gate-layout">
          Expected layout:
          <code>
            your-folder/
            <br />
            &nbsp;&nbsp;inventory.csv
            <br />
            &nbsp;&nbsp;categories.csv
            <br />
            &nbsp;&nbsp;images/…
          </code>
        </p>
        {supported ? (
          <button
            type="button"
            className="btn-primary project-gate-cta"
            onClick={() => void openFolder()}
          >
            Open project folder
          </button>
        ) : (
          <p className="project-gate-warn">
            This browser cannot open a project folder. Use Chrome or Edge on a
            desktop, then choose your OneDrive project folder.
          </p>
        )}
      </div>
    </div>
  );
}
