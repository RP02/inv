# inv

Lightweight static inventory + vendor cost comparison app (GitHub Pages friendly).

## Features

- Catalog dashboard with search and category filters
- Item detail with editable vendor comparison table
- Effective cost = goods + shipping, order qty = `max(preferredQty, moq)`
- Best-value vendor highlighted (lowest effective $/unit)
- Import / Save CSV (File System Access API when available)
- Optional primary catalog photo + per-vendor photos
- `localStorage` cache so refresh does not lose edits

## Develop

```bash
npm install
npm run dev
```

App runs at http://localhost:3001/inv/

## Project folder (OneDrive)

Prefer **Open folder** (Chrome/Edge) on a OneDrive directory:

```text
inv-data/
  inventory.csv
  categories.csv
  images/{categoryId}/{itemId}/_primary.jpg
  images/{categoryId}/{itemId}/{vendor}.jpg
```

- **Categories** — add categories with stable ids (`cat_dairy`, …).
- Details: [`docs/image-storage.md`](docs/image-storage.md).

## Build / deploy

```bash
npm run build
npm run deploy
```
