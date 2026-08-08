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
  deleteProjectFile,
  fileToResizedDataUrl,
  processImageFile,
  isRelativeImagePath,
  loadCatalogFromProjectFolder,
  loadCatalogFromStorage,
  loadProjectDirHandle,
  openProjectFolder,
  queryProjectDirPermission,
  readProjectFileAsObjectUrl,
  relocateItemImages,
  renameCategory,
  requestProjectDirPermission,
  rewriteItemImageCategoryPaths,
  saveCatalogToProjectFolder,
  saveCatalogToStorage,
  storeProjectDirHandle,
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
  folderBootstrapping: boolean;
  pendingFolderName: string | null;
  saveNotice: string | null;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  openFolder: () => Promise<void>;
  reconnectFolder: () => Promise<void>;
  saveCsv: () => Promise<void>;
  addItem: (categoryId?: string) => void;
  removeItem: (itemId: string) => void;
  patchItem: (itemId: string, patch: Partial<Item>) => void;
  changeItemCategory: (itemId: string, categoryId: string) => Promise<void>;
  saveItem: (item: Item) => void;
  addOffer: (itemId: string) => void;
  saveOffer: (itemId: string, offer: VendorOffer) => void;
  removeOffer: (itemId: string, offerId: string) => Promise<void>;
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
  clearPrimaryImage: (itemId: string) => Promise<void>;
  clearOfferImage: (item: Item, offer: VendorOffer) => Promise<void>;
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
  const [folderBootstrapping, setFolderBootstrapping] = useState(true);
  const [pendingFolderName, setPendingFolderName] = useState<string | null>(
    null
  );
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);
  const dirHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
  const pendingDirRef = useRef<FileSystemDirectoryHandle | null>(null);
  const objectUrlCache = useRef<Map<string, string>>(new Map());
  const dirtyRef = useRef(false);
  const catalogRef = useRef(catalog);
  const hasFolderRef = useRef(false);

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  useEffect(() => {
    catalogRef.current = catalog;
  }, [catalog]);

  useEffect(() => {
    hasFolderRef.current = hasProjectFolder;
  }, [hasProjectFolder]);

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

  const bustImageCache = useCallback((path: string) => {
    const old = objectUrlCache.current.get(path);
    if (old) {
      URL.revokeObjectURL(old);
      objectUrlCache.current.delete(path);
    }
  }, []);

  const showSaveNotice = useCallback((message: string) => {
    setSaveNotice(message);
  }, []);

  useEffect(() => {
    if (!saveNotice) {
      return;
    }
    const id = window.setTimeout(() => setSaveNotice(null), 2200);
    return () => window.clearTimeout(id);
  }, [saveNotice]);

  const replaceCatalog = useCallback((next: Catalog, markDirty: boolean) => {
    setCatalog(next);
    setDirty(markDirty);
  }, []);

  const attachFolder = useCallback(
    async (dir: FileSystemDirectoryHandle, reloadFromDisk: boolean) => {
      dirHandleRef.current = dir;
      fileHandleRef.current = null;
      pendingDirRef.current = null;
      setPendingFolderName(null);
      setHasProjectFolder(true);
      await storeProjectDirHandle(dir);
      if (reloadFromDisk) {
        const loaded = await loadCatalogFromProjectFolder(dir);
        replaceCatalog(loaded, false);
      } else {
        setCatalog((c) => ({ ...c, projectName: dir.name }));
      }
    },
    [replaceCatalog]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const handle = await loadProjectDirHandle();
        if (cancelled) {
          return;
        }
        if (!handle) {
          setFolderBootstrapping(false);
          return;
        }
        const perm = await queryProjectDirPermission(handle);
        if (cancelled) {
          return;
        }
        if (perm === "granted") {
          await attachFolder(handle, true);
        } else {
          pendingDirRef.current = handle;
          setPendingFolderName(handle.name);
        }
      } catch (err) {
        console.warn("Could not restore project folder", err);
      } finally {
        if (!cancelled) {
          setFolderBootstrapping(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attachFolder]);

  const confirmDiscardIfDirty = useCallback((actionLabel: string): boolean => {
    if (!dirtyRef.current) {
      return true;
    }
    return window.confirm(
      `You have unsaved CSV changes. ${actionLabel} will discard them. Continue?`
    );
  }, []);

  const openFolder = useCallback(async () => {
    if (hasFolderRef.current && !confirmDiscardIfDirty("Switching folder")) {
      return;
    }
    const dir = await openProjectFolder();
    if (!dir) {
      return;
    }
    await attachFolder(dir, true);
  }, [attachFolder, confirmDiscardIfDirty]);

  const reconnectFolder = useCallback(async () => {
    const dir = pendingDirRef.current;
    if (!dir) {
      await openFolder();
      return;
    }
    const ok = await requestProjectDirPermission(dir);
    if (!ok) {
      alert("Permission to use the project folder was denied.");
      return;
    }
    await attachFolder(dir, true);
  }, [attachFolder, openFolder]);

  const saveCsv = useCallback(async () => {
    if (!dirHandleRef.current) {
      alert("Open a project folder first. Nothing is saved until a folder is linked.");
      return;
    }
    try {
      await saveCatalogToProjectFolder(dirHandleRef.current, catalogRef.current);
      setDirty(false);
      showSaveNotice("CSV saved");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Could not save CSV.");
    }
  }, [showSaveNotice]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "s") {
        return;
      }
      e.preventDefault();
      if (!hasFolderRef.current) {
        return;
      }
      void saveCsv();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveCsv]);

  const addItem = useCallback(
    (categoryId?: string) => {
      const fromFilter =
        categoryId &&
        catalog.categories.some((c) => c.id === categoryId)
          ? categoryId
          : undefined;
      const defaultCat =
        fromFilter ??
        catalog.categories.find((c) => c.id !== "cat_uncategorized")?.id ??
        "cat_uncategorized";
      const item = createEmptyItem(defaultCat);
      setCatalog((c) => upsertItem(c, item));
      setSelectedItemId(item.id);
      setDirty(true);
    },
    [catalog.categories]
  );

  const removeItem = useCallback((itemId: string) => {
    setCatalog((c) => deleteItem(c, itemId));
    setSelectedItemId((id) => (id === itemId ? null : id));
    setDirty(true);
  }, []);

  const patchItem = useCallback((itemId: string, patch: Partial<Item>) => {
    setCatalog((c) => updateItemFields(c, itemId, patch));
    setDirty(true);
  }, []);

  const changeItemCategory = useCallback(
    async (itemId: string, categoryId: string) => {
      const item = catalogRef.current.items.find((i) => i.id === itemId);
      if (!item || item.categoryId === categoryId) {
        return;
      }

      let next: Item;
      if (dirHandleRef.current) {
        try {
          next = await relocateItemImages(
            dirHandleRef.current,
            item,
            categoryId
          );
        } catch (err) {
          console.error(err);
          alert(
            err instanceof Error
              ? err.message
              : "Could not move item photos to the new category."
          );
          return;
        }
        if (item.primaryImageUrl) {
          bustImageCache(item.primaryImageUrl);
        }
        if (next.primaryImageUrl) {
          bustImageCache(next.primaryImageUrl);
        }
        for (const offer of item.offers) {
          if (offer.imageUrl) {
            bustImageCache(offer.imageUrl);
          }
        }
        for (const offer of next.offers) {
          if (offer.imageUrl) {
            bustImageCache(offer.imageUrl);
          }
        }
      } else {
        next = rewriteItemImageCategoryPaths(item, categoryId);
      }

      setCatalog((c) => upsertItem(c, next));
      setDirty(true);
    },
    [bustImageCache]
  );

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

  const removeOffer = useCallback(
    async (itemId: string, offerId: string) => {
      const item = catalogRef.current.items.find((i) => i.id === itemId);
      const offer = item?.offers.find((o) => o.id === offerId);
      const path = offer?.imageUrl;
      if (dirHandleRef.current && isRelativeImagePath(path)) {
        await deleteProjectFile(dirHandleRef.current, path!);
        bustImageCache(path!);
      }
      setCatalog((c) => deleteOffer(c, itemId, offerId));
      setDirty(true);
    },
    [bustImageCache]
  );

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

  const deleteRelativeImage = useCallback(
    async (path: string | undefined) => {
      if (!dirHandleRef.current || !isRelativeImagePath(path)) {
        return;
      }
      await deleteProjectFile(dirHandleRef.current, path!);
      bustImageCache(path!);
    },
    [bustImageCache]
  );

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
        if (offer.imageUrl && offer.imageUrl !== relativePath) {
          await deleteRelativeImage(offer.imageUrl);
        }
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
    [bustImageCache, deleteRelativeImage]
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
        if (item.primaryImageUrl && item.primaryImageUrl !== relativePath) {
          await deleteRelativeImage(item.primaryImageUrl);
        }
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
    [bustImageCache, deleteRelativeImage]
  );

  const clearPrimaryImage = useCallback(
    async (itemId: string) => {
      const item = catalogRef.current.items.find((i) => i.id === itemId);
      await deleteRelativeImage(item?.primaryImageUrl);
      setCatalog((c) =>
        updateItemFields(c, itemId, { primaryImageUrl: undefined })
      );
      setDirty(true);
    },
    [deleteRelativeImage]
  );

  const clearOfferImage = useCallback(
    async (item: Item, offer: VendorOffer) => {
      await deleteRelativeImage(offer.imageUrl);
      setCatalog((c) =>
        upsertOffer(c, item.id, { ...offer, imageUrl: undefined })
      );
      setDirty(true);
    },
    [deleteRelativeImage]
  );

  const value = useMemo<InventoryContextValue>(
    () => ({
      catalog,
      dirty,
      fileName: catalog.fileName || "inventory.csv",
      categoriesFileName: catalog.categoriesFileName || "categories.csv",
      projectLabel: hasProjectFolder
        ? catalog.projectName || "project folder"
        : pendingFolderName || "No project folder",
      hasProjectFolder,
      folderBootstrapping,
      pendingFolderName,
      saveNotice,
      selectedItemId,
      setSelectedItemId,
      openFolder,
      reconnectFolder,
      saveCsv,
      addItem,
      removeItem,
      patchItem,
      changeItemCategory,
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
      clearOfferImage,
    }),
    [
      catalog,
      dirty,
      hasProjectFolder,
      folderBootstrapping,
      pendingFolderName,
      saveNotice,
      selectedItemId,
      openFolder,
      reconnectFolder,
      saveCsv,
      addItem,
      removeItem,
      patchItem,
      changeItemCategory,
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
      clearOfferImage,
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
