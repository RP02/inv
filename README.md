# inv

Lightweight static inventory + vendor cost comparison app (GitHub Pages friendly).

## Features

- Catalog dashboard with search and category filters
- Item detail with editable vendor comparison table
- Vendor quotes: Total Price + #units → unit price (`total ÷ units`)
- Best-value vendor highlighted (lowest unit price)
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
npm run deploy
```

`predeploy` bumps the patch version in `package.json` (`0.1.0` → `0.1.1`, …), then builds. The footer shows that version. Commit the updated `package.json` / `package-lock.json` after deploy so git stays in sync.

For a manual bump without deploying: `npm version patch|minor|major --no-git-tag-version`.
