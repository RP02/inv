import {
  DEFAULT_CATEGORIES_FILE,
  DEFAULT_INVENTORY_FILE,
  IMAGES_DIR,
} from "./constants";
import {
  categoriesToRows,
  catalogToRows,
  parseCatalogFromRows,
  parseCategoriesFromRows,
} from "./csvInventory";
import {
  CsvRows,
  isFileSystemAccessSupported,
  parseCsvText,
  rowsToCsvString,
} from "./fileSystemCsv";
import { relativePrimaryImagePath, relativeVendorImagePath } from "./slugs";
import { Catalog } from "./types";

function isAbortError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name: string }).name === "AbortError"
  );
}

async function ensurePermission(
  handle: FileSystemHandle,
  mode: "read" | "readwrite"
): Promise<boolean> {
  const opts: FileSystemHandlePermissionDescriptor = { mode };
  if ((await handle.queryPermission(opts)) === "granted") {
    return true;
  }
  return (await handle.requestPermission(opts)) === "granted";
}

export async function openProjectFolder(): Promise<FileSystemDirectoryHandle | null> {
  if (!window.showDirectoryPicker) {
    return null;
  }
  try {
    const dir = await window.showDirectoryPicker({ mode: "readwrite" });
    if (!(await ensurePermission(dir, "readwrite"))) {
      throw new Error("Permission to use the project folder was denied.");
    }
    return dir;
  } catch (err: unknown) {
    if (isAbortError(err)) {
      return null;
    }
    throw err;
  }
}

async function readCsvFromDir(
  dir: FileSystemDirectoryHandle,
  name: string
): Promise<string[][] | null> {
  try {
    const handle = await dir.getFileHandle(name);
    if (!(await ensurePermission(handle, "read"))) {
      return null;
    }
    const text = await (await handle.getFile()).text();
    return parseCsvText(text);
  } catch {
    return null;
  }
}

async function writeCsvToDir(
  dir: FileSystemDirectoryHandle,
  name: string,
  rows: CsvRows
): Promise<void> {
  const handle = await dir.getFileHandle(name, { create: true });
  if (!(await ensurePermission(handle, "readwrite"))) {
    throw new Error(`Permission to write ${name} was denied.`);
  }
  const writable = await handle.createWritable();
  await writable.write(rowsToCsvString(rows));
  await writable.close();
}

export async function loadCatalogFromProjectFolder(
  dir: FileSystemDirectoryHandle
): Promise<Catalog> {
  const categoryRows = await readCsvFromDir(dir, DEFAULT_CATEGORIES_FILE);
  const categories = categoryRows
    ? parseCategoriesFromRows(categoryRows)
    : parseCategoriesFromRows([]);

  const inventoryRows = await readCsvFromDir(dir, DEFAULT_INVENTORY_FILE);
  if (!inventoryRows) {
    // Allow empty new project folder
    return {
      categories,
      items: [],
      fileName: DEFAULT_INVENTORY_FILE,
      categoriesFileName: DEFAULT_CATEGORIES_FILE,
      projectName: dir.name,
    };
  }

  const catalog = parseCatalogFromRows(inventoryRows, categories);
  return {
    ...catalog,
    fileName: DEFAULT_INVENTORY_FILE,
    categoriesFileName: DEFAULT_CATEGORIES_FILE,
    projectName: dir.name,
  };
}

export async function saveCatalogToProjectFolder(
  dir: FileSystemDirectoryHandle,
  catalog: Catalog
): Promise<void> {
  await writeCsvToDir(
    dir,
    catalog.categoriesFileName || DEFAULT_CATEGORIES_FILE,
    categoriesToRows(catalog.categories)
  );
  await writeCsvToDir(
    dir,
    catalog.fileName || DEFAULT_INVENTORY_FILE,
    catalogToRows(catalog)
  );
}

/** Walk/create nested path segments under dir. */
async function getOrCreateNestedDir(
  root: FileSystemDirectoryHandle,
  segments: string[]
): Promise<FileSystemDirectoryHandle> {
  let current = root;
  for (const segment of segments) {
    current = await current.getDirectoryHandle(segment, { create: true });
  }
  return current;
}

async function resolveFileHandle(
  root: FileSystemDirectoryHandle,
  relativePath: string,
  create: boolean
): Promise<FileSystemFileHandle | null> {
  const parts = relativePath.replace(/\\/g, "/").split("/").filter(Boolean);
  if (parts.length === 0) {
    return null;
  }
  const fileName = parts[parts.length - 1];
  const dirParts = parts.slice(0, -1);
  try {
    const dir = create
      ? await getOrCreateNestedDir(root, dirParts)
      : await (async () => {
          let current = root;
          for (const segment of dirParts) {
            current = await current.getDirectoryHandle(segment);
          }
          return current;
        })();
    return await dir.getFileHandle(fileName, { create });
  } catch {
    return null;
  }
}

export async function readProjectFileAsObjectUrl(
  root: FileSystemDirectoryHandle,
  relativePath: string
): Promise<string | null> {
  const handle = await resolveFileHandle(root, relativePath, false);
  if (!handle) {
    return null;
  }
  if (!(await ensurePermission(handle, "read"))) {
    return null;
  }
  const file = await handle.getFile();
  return URL.createObjectURL(file);
}

async function writeBlobAtPath(
  root: FileSystemDirectoryHandle,
  relativePath: string,
  blob: Blob
): Promise<string> {
  const handle = await resolveFileHandle(root, relativePath, true);
  if (!handle) {
    throw new Error("Could not create image file in project folder.");
  }
  if (!(await ensurePermission(handle, "readwrite"))) {
    throw new Error("Permission to write image was denied.");
  }
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
  return relativePath;
}

export async function writeVendorImageToProject(
  root: FileSystemDirectoryHandle,
  categoryId: string,
  itemId: string,
  vendor: string,
  offerId: string,
  blob: Blob,
  ext = "jpg"
): Promise<string> {
  return writeBlobAtPath(
    root,
    relativeVendorImagePath(categoryId, itemId, vendor, offerId, ext),
    blob
  );
}

export async function writePrimaryImageToProject(
  root: FileSystemDirectoryHandle,
  categoryId: string,
  itemId: string,
  blob: Blob,
  ext = "jpg"
): Promise<string> {
  return writeBlobAtPath(
    root,
    relativePrimaryImagePath(categoryId, itemId, ext),
    blob
  );
}

export function isRelativeImagePath(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  if (
    value.startsWith("data:") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return false;
  }
  return (
    value.startsWith(`${IMAGES_DIR}/`) ||
    value.startsWith("./") ||
    !value.includes("://")
  );
}

export { isFileSystemAccessSupported };
