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
  catalogToRows,
  createEmptyItem,
  createEmptyOffer,
  deleteItem,
  deleteOffer,
  downloadCsv,
  getMockCatalog,
  isFileSystemAccessSupported,
  loadCatalogFromStorage,
  openCsvFile,
  parseCatalogFromRows,
  pickCsvViaInput,
  saveCatalogToStorage,
  saveCsvAs,
  saveCsvToHandle,
  updateItemFields,
  upsertItem,
  upsertOffer,
} from "../api/inventory";

type InventoryContextValue = {
  catalog: Catalog;
  dirty: boolean;
  fileName: string;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  importCsv: () => Promise<void>;
  saveCsv: () => Promise<void>;
  loadMock: () => void;
  addItem: () => void;
  removeItem: (itemId: string) => void;
  patchItem: (itemId: string, patch: Partial<Item>) => void;
  saveItem: (item: Item) => void;
  addOffer: (itemId: string) => void;
  saveOffer: (itemId: string, offer: VendorOffer) => void;
  removeOffer: (itemId: string, offerId: string) => void;
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

function initialCatalog(): Catalog {
  return loadCatalogFromStorage() ?? getMockCatalog();
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog>(initialCatalog);
  const [dirty, setDirty] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);

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

  const replaceCatalog = useCallback((next: Catalog, markDirty: boolean) => {
    setCatalog(next);
    setDirty(markDirty);
  }, []);

  const importCsv = useCallback(async () => {
    if (isFileSystemAccessSupported()) {
      const result = await openCsvFile();
      if (!result) {
        return;
      }
      fileHandleRef.current = result.handle;
      replaceCatalog(
        { ...parseCatalogFromRows(result.rows), fileName: result.name },
        false
      );
      return;
    }

    const result = await pickCsvViaInput();
    if (!result) {
      return;
    }
    fileHandleRef.current = null;
    replaceCatalog(
      { ...parseCatalogFromRows(result.rows), fileName: result.name },
      false
    );
  }, [replaceCatalog]);

  const saveCsv = useCallback(async () => {
    const rows = catalogToRows(catalog);
    const suggested = catalog.fileName || "inventory.csv";

    if (fileHandleRef.current) {
      await saveCsvToHandle(fileHandleRef.current, rows);
      setDirty(false);
      return;
    }

    if (isFileSystemAccessSupported()) {
      const saved = await saveCsvAs(rows, suggested);
      if (saved) {
        fileHandleRef.current = saved.handle;
        setCatalog((c) => ({ ...c, fileName: saved.name }));
        setDirty(false);
        return;
      }
    }

    downloadCsv(rows, suggested);
    setDirty(false);
  }, [catalog]);

  const loadMock = useCallback(() => {
    fileHandleRef.current = null;
    replaceCatalog(getMockCatalog(), false);
  }, [replaceCatalog]);

  const addItem = useCallback(() => {
    const item = createEmptyItem();
    setCatalog((c) => upsertItem(c, item));
    setSelectedItemId(item.id);
    setDirty(true);
  }, []);

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

  const value = useMemo<InventoryContextValue>(
    () => ({
      catalog,
      dirty,
      fileName: catalog.fileName || "unsaved.csv",
      selectedItemId,
      setSelectedItemId,
      importCsv,
      saveCsv,
      loadMock,
      addItem,
      removeItem,
      patchItem,
      saveItem,
      addOffer,
      saveOffer,
      removeOffer,
    }),
    [
      catalog,
      dirty,
      selectedItemId,
      importCsv,
      saveCsv,
      loadMock,
      addItem,
      removeItem,
      patchItem,
      saveItem,
      addOffer,
      saveOffer,
      removeOffer,
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
