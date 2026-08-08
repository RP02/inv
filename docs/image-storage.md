# Vendor images + categories (current design)

## Project folder layout

```text
{project}/
  inventory.csv
  categories.csv
  images/
    {categoryId}/
      {itemId}/
        _primary.jpg          # optional catalog face (card)
        {vendorSlug}.jpg      # per-vendor photos in comparison table
```

Example:

```text
my-inventory/
  inventory.csv
  categories.csv
  images/
    cat_dairy/
      item_cream/
        _primary.jpg
        sysco.jpg
        restaurant-depot.jpg
    cat_flavorings/
      item_vanilla/
        webstaurant.jpg
```

**Card image rule:** use `primaryImageUrl` if set, otherwise the first vendor photo.

## CSV

**categories.csv**

```text
id,name
cat_dairy,Dairy
cat_flavorings,Flavorings
```

**inventory.csv** — `categoryId` + `itemId`; `imageUrl` is a relative path:

```text
itemId,sku,name,categoryId,...,vendor,...,imageUrl,...
item_cream,CRM-HVY-36,Heavy Cream,cat_dairy,...,Sysco,...,images/cat_dairy/item_cream/sysco.jpg,...
```

## App workflow

1. **Open folder** — choose the project directory (Chrome/Edge).
2. **Categories** — add/rename categories; ids are stable (`cat_{slug}`).
3. **Upload** photo (Gallery or Camera) — accepts JPEG, PNG, WebP, GIF; writes under `images/{categoryId}/{itemId}/` with the matching extension.
4. **Save project** — writes `inventory.csv` + `categories.csv` (image files already on disk).

Without a folder open (typical on phones), upload falls back to a data URL in localStorage — fine for quick camera shots; use **Open folder** on desktop for shared disk storage.

**Mobile:** Camera button uses the device camera; Gallery opens the photo library. File System Access is desktop-oriented (Chrome/Edge).
