import { useState } from "react";
import { UNCATEGORIZED_ID } from "../api/inventory/constants";
import { useInventory } from "../context/InventoryContext";

type Props = {
  onClose: () => void;
};

export default function CategoriesModal({ onClose }: Props) {
  const {
    catalog,
    createCategory,
    updateCategoryName,
    removeCategory,
  } = useInventory();
  const [name, setName] = useState("");

  const onAdd = () => {
    if (!name.trim()) {
      return;
    }
    createCategory(name);
    setName("");
  };

  return (
    <div className="detail-overlay" role="dialog" aria-modal="true">
      <div className="detail-panel categories-panel">
        <div className="detail-header">
          <h2>Categories</h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="hint">
          Each category has a stable <code>id</code> used for image folders:
          <code> images/&#123;categoryId&#125;/&#123;itemId&#125;/</code>
        </p>

        <div className="category-add">
          <input
            type="text"
            placeholder="New category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onAdd();
              }
            }}
          />
          <button type="button" onClick={onAdd}>
            Add category
          </button>
        </div>

        <table className="vendor-table">
          <thead>
            <tr>
              <th>Id</th>
              <th>Name</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {catalog.categories.map((cat) => (
              <tr key={cat.id}>
                <td>
                  <code>{cat.id}</code>
                </td>
                <td>
                  <input
                    type="text"
                    value={cat.name}
                    disabled={cat.id === UNCATEGORIZED_ID}
                    onChange={(e) =>
                      updateCategoryName(cat.id, e.target.value)
                    }
                  />
                </td>
                <td>
                  {cat.id === UNCATEGORIZED_ID ? (
                    <span className="meta">default</span>
                  ) : (
                    <button
                      type="button"
                      className="danger"
                      onClick={() => {
                        if (
                          confirm(
                            `Delete category "${cat.name}"? Items move to Uncategorized.`
                          )
                        ) {
                          removeCategory(cat.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
