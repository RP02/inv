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
  createEmptyCatalog,
  createEmptyItem,
  createEmptyOffer,
  deleteCategory,
  deleteItem,
  deleteOffer,
  fileToResizedDataUrl,
  processImageFile,
  isRelativeImagePath,
  loadCatalogFromProjectFolder,
  loadCatalogFromStorage,
  openProjectFolder,
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
  categoriesFileName: string;
  projectLabel: string;
  hasProjectFolder: boolean;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  openFolder: () => Promise<void>;
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

  const saveCsv = useCallback(async () => {
    if (!dirHandleRef.current) {
      alert("Open a project folder first. Nothing is saved until a folder is linked.");
      return;
    }
    await saveCatalogToProjectFolder(dirHandleRef.current, catalog);
    setDirty(false);
  }, [catalog]);

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
      categoriesFileName: catalog.categoriesFileName || "categories.csv",
      projectLabel: hasProjectFolder
        ? catalog.projectName || "project folder"
        : "No project folder",
      hasProjectFolder,
      selectedItemId,
      setSelectedItemId,
      openFolder,
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
