import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Catalog,
  Item,
  VendorOffer,
  addCategory,
  catalogToRows,
  categoriesToRows,
  createEmptyCatalog,
  createEmptyItem,
  createEmptyOffer,
  deleteCategory,
  deleteItem,
  deleteOffer,
  downloadCsv,
  fileToResizedDataUrl,
  processImageFile,
  isFileSystemAccessSupported,
  isRelativeImagePath,
  loadCatalogFromProjectFolder,
  loadCatalogFromStorage,
  openCsvFile,
  openProjectFolder,
  parseCatalogFromRows,
  pickCsvViaInput,
  readProjectFileAsObjectUrl,
  renameCategory,
  saveCatalogToProjectFolder,
  saveCatalogToStorage,
  updateItemFields,
  upsertItem,
  upsertOffer,
  writePrimaryImageToProject,
  writeVendorImageToProject,
} from "../api/inventory";

type InventoryContextValue = {
  catalog: Catalog;
  dirty: boolean;
  fileName: string;
  projectLabel: string;
  hasProjectFolder: boolean;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  openFolder: () => Promise<void>;
  importCsv: () => Promise<void>;
  saveCsv: () => Promise<void>;
  addItem: () => void;
  removeItem: (itemId: string) => void;
  patchItem: (itemId: string, patch: Partial<Item>) => void;
  saveItem: (item: Item) => void;
  addOffer: (itemId: string) => void;
  saveOffer: (itemId: string, offer: VendorOffer) => void;
  removeOffer: (itemId: string, offerId: string) => void;
  createCategory: (name: string) => void;
  updateCategoryName: (categoryId: string, name: string) => void;
  removeCategory: (categoryId: string) => void;
  resolveImageSrc: (imageUrl: string | undefined) => Promise<string | null>;
  uploadOfferImage: (
    item: Item,
    offer: VendorOffer,
    file: File
  ) => Promise<void>;
  uploadPrimaryImage: (item: Item, file: File) => Promise<void>;
  clearPrimaryImage: (itemId: string) => void;
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

function initialCatalog(): Catalog {
  return loadCatalogFromStorage() ?? createEmptyCatalog();
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog>(initialCatalog);
  const [dirty, setDirty] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [hasProjectFolder, setHasProjectFolder] = useState(false);
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);
  const dirHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
  const objectUrlCache = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    saveCatalogToStorage(catalog);
  }, [catalog]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) {
        return;
      }
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    return () => {
      for (const url of objectUrlCache.current.values()) {
        URL.revokeObjectURL(url);
      }
      objectUrlCache.current.clear();
    };
  }, []);

  const replaceCatalog = useCallback((next: Catalog, markDirty: boolean) => {
    setCatalog(next);
    setDirty(markDirty);
  }, []);

  const bindProjectFolder = useCallback(
    (dir: FileSystemDirectoryHandle) => {
      dirHandleRef.current = dir;
      fileHandleRef.current = null;
      setHasProjectFolder(true);
      setCatalog((c) => ({
        ...c,
        projectName: dir.name,
        fileName: c.fileName || "inventory.csv",
        categoriesFileName: c.categoriesFileName || "categories.csv",
      }));
    },
    []
  );

  const openFolder = useCallback(async () => {
    const dir = await openProjectFolder();
    if (!dir) {
      return;
    }
    dirHandleRef.current = dir;
    fileHandleRef.current = null;
    setHasProjectFolder(true);
    const loaded = await loadCatalogFromProjectFolder(dir);
    replaceCatalog(loaded, false);
  }, [replaceCatalog]);

  const importCsv = useCallback(async () => {
    if (isFileSystemAccessSupported()) {
      const result = await openCsvFile();
      if (!result) {
        return;
      }
      fileHandleRef.current = result.handle;
      dirHandleRef.current = null;
      setHasProjectFolder(false);
      replaceCatalog(
        {
          ...parseCatalogFromRows(result.rows, catalog.categories),
          fileName: result.name,
          projectName: undefined,
        },
        false
      );
      return;
    }

    const result = await pickCsvViaInput();
    if (!result) {
      return;
    }
    fileHandleRef.current = null;
    dirHandleRef.current = null;
    setHasProjectFolder(false);
    replaceCatalog(
      {
        ...parseCatalogFromRows(result.rows, catalog.categories),
        fileName: result.name,
        projectName: undefined,
      },
      false
    );
  }, [catalog.categories, replaceCatalog]);

  const saveCsv = useCallback(async () => {
    // Preferred path: write inventory.csv + categories.csv into the open project folder.
    if (dirHandleRef.current) {
      await saveCatalogToProjectFolder(dirHandleRef.current, catalog);
      setDirty(false);
      return;
    }

    // No folder open — ask before using browser Downloads.
    const openInstead = window.confirm(
      "No project folder is open.\n\n" +
        "Click OK to choose a folder and save inventory.csv + categories.csv there " +
        "(recommended for images).\n\n" +
        "Click Cancel to download both CSVs to your browser Downloads folder instead."
    );

    if (openInstead) {
      const dir = await openProjectFolder();
      if (!dir) {
        return;
      }
      bindProjectFolder(dir);
      await saveCatalogToProjectFolder(dir, {
        ...catalog,
        projectName: dir.name,
        fileName: catalog.fileName || "inventory.csv",
        categoriesFileName: catalog.categoriesFileName || "categories.csv",
      });
      setDirty(false);
      return;
    }

    downloadCsv(catalogToRows(catalog), catalog.fileName || "inventory.csv");
    downloadCsv(
      categoriesToRows(catalog.categories),
      catalog.categoriesFileName || "categories.csv"
    );
    setDirty(false);
  }, [bindProjectFolder, catalog]);

  const addItem = useCallback(() => {
    const defaultCat =
      catalog.categories.find((c) => c.id !== "cat_uncategorized")?.id ??
      "cat_uncategorized";
    const item = createEmptyItem(defaultCat);
    setCatalog((c) => upsertItem(c, item));
    setSelectedItemId(item.id);
    setDirty(true);
  }, [catalog.categories]);

  const removeItem = useCallback((itemId: string) => {
    setCatalog((c) => deleteItem(c, itemId));
    setSelectedItemId((id) => (id === itemId ? null : id));
    setDirty(true);
  }, []);

  const patchItem = useCallback((itemId: string, patch: Partial<Item>) => {
    setCatalog((c) => updateItemFields(c, itemId, patch));
    setDirty(true);
  }, []);

  const saveItem = useCallback((item: Item) => {
    setCatalog((c) => upsertItem(c, item));
    setDirty(true);
  }, []);

  const addOffer = useCallback((itemId: string) => {
    const offer = createEmptyOffer();
    setCatalog((c) => upsertOffer(c, itemId, offer));
    setDirty(true);
  }, []);

  const saveOffer = useCallback((itemId: string, offer: VendorOffer) => {
    setCatalog((c) => upsertOffer(c, itemId, offer));
    setDirty(true);
  }, []);

  const removeOffer = useCallback((itemId: string, offerId: string) => {
    setCatalog((c) => deleteOffer(c, itemId, offerId));
    setDirty(true);
  }, []);

  const createCategory = useCallback((name: string) => {
    setCatalog((c) => addCategory(c, name));
    setDirty(true);
  }, []);

  const updateCategoryName = useCallback((categoryId: string, name: string) => {
    setCatalog((c) => renameCategory(c, categoryId, name));
    setDirty(true);
  }, []);

  const removeCategory = useCallback((categoryId: string) => {
    setCatalog((c) => deleteCategory(c, categoryId));
    setDirty(true);
  }, []);

  const resolveImageSrc = useCallback(
    async (imageUrl: string | undefined): Promise<string | null> => {
      if (!imageUrl) {
        return null;
      }
      if (
        imageUrl.startsWith("data:") ||
        imageUrl.startsWith("http://") ||
        imageUrl.startsWith("https://")
      ) {
        return imageUrl;
      }
      if (!isRelativeImagePath(imageUrl) || !dirHandleRef.current) {
        return null;
      }
      const cached = objectUrlCache.current.get(imageUrl);
      if (cached) {
        return cached;
      }
      const url = await readProjectFileAsObjectUrl(
        dirHandleRef.current,
        imageUrl
      );
      if (url) {
        objectUrlCache.current.set(imageUrl, url);
      }
      return url;
    },
    []
  );

  const bustImageCache = useCallback((path: string) => {
    const old = objectUrlCache.current.get(path);
    if (old) {
      URL.revokeObjectURL(old);
      objectUrlCache.current.delete(path);
    }
  }, []);

  const uploadOfferImage = useCallback(
    async (item: Item, offer: VendorOffer, file: File) => {
      if (dirHandleRef.current) {
        const processed = await processImageFile(file);
        const relativePath = await writeVendorImageToProject(
          dirHandleRef.current,
          item.categoryId,
          item.id,
          offer.vendor || "vendor",
          offer.id,
          processed.blob,
          processed.ext
        );
        bustImageCache(relativePath);
        setCatalog((c) =>
          upsertOffer(c, item.id, { ...offer, imageUrl: relativePath })
        );
        setDirty(true);
        return;
      }

      const dataUrl = await fileToResizedDataUrl(file);
      setCatalog((c) =>
        upsertOffer(c, item.id, { ...offer, imageUrl: dataUrl })
      );
      setDirty(true);
    },
    [bustImageCache]
  );

  const uploadPrimaryImage = useCallback(
    async (item: Item, file: File) => {
      if (dirHandleRef.current) {
        const processed = await processImageFile(file);
        const relativePath = await writePrimaryImageToProject(
          dirHandleRef.current,
          item.categoryId,
          item.id,
          processed.blob,
          processed.ext
        );
        bustImageCache(relativePath);
        setCatalog((c) =>
          updateItemFields(c, item.id, { primaryImageUrl: relativePath })
        );
        setDirty(true);
        return;
      }

      const dataUrl = await fileToResizedDataUrl(file);
      setCatalog((c) =>
        updateItemFields(c, item.id, { primaryImageUrl: dataUrl })
      );
      setDirty(true);
    },
    [bustImageCache]
  );

  const clearPrimaryImage = useCallback((itemId: string) => {
    setCatalog((c) =>
      updateItemFields(c, itemId, { primaryImageUrl: undefined })
    );
    setDirty(true);
  }, []);

  const value = useMemo<InventoryContextValue>(
    () => ({
      catalog,
      dirty,
      fileName: catalog.fileName || "inventory.csv",
      projectLabel: hasProjectFolder
        ? catalog.projectName || "project folder"
        : catalog.projectName || "no folder",
      hasProjectFolder,
      selectedItemId,
      setSelectedItemId,
      openFolder,
      importCsv,
      saveCsv,
      addItem,
      removeItem,
      patchItem,
      saveItem,
      addOffer,
      saveOffer,
      removeOffer,
      createCategory,
      updateCategoryName,
      removeCategory,
      resolveImageSrc,
      uploadOfferImage,
      uploadPrimaryImage,
      clearPrimaryImage,
    }),
    [
      catalog,
      dirty,
      hasProjectFolder,
      selectedItemId,
      openFolder,
      importCsv,
      saveCsv,
      addItem,
      removeItem,
      patchItem,
      saveItem,
      addOffer,
      saveOffer,
      removeOffer,
      createCategory,
      updateCategoryName,
      removeCategory,
      resolveImageSrc,
      uploadOfferImage,
      uploadPrimaryImage,
      clearPrimaryImage,
    ]
  );

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory(): InventoryContextValue {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new Error("useInventory must be used within InventoryProvider");
  }
  return ctx;
}
