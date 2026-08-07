# inv

Lightweight static inventory + vendor cost comparison app (GitHub Pages friendly).

## Features

- Catalog dashboard with search and category filters
- Item detail with editable vendor comparison table
- Effective cost = goods + shipping, order qty = `max(preferredQty, moq)`
- Best-value vendor highlighted (lowest effective $/unit)
- Import / Save CSV (File System Access API when available; download / file input fallback)
- `localStorage` cache so refresh does not lose edits
- Built-in sample mock data (in-house ice cream & dessert ingredients)

## Develop

```bash
npm install
npm run dev
```

App runs at http://localhost:3001 (base path `/inv/`).

## CSV shape

One row per vendor offer (same SKU repeated):

`sku,name,category,imageUrl,notes,unit,preferredQty,vendor,vendorSku,unitPrice,currency,moq,shippingFlat,shippingPerUnit,leadDays,url,lastChecked`

Sample file: `sample-data/inventory.sample.csv`

## Build / deploy

```bash
npm run build
npm run deploy
```
