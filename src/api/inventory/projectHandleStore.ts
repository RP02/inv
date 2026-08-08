/** Persist the project directory handle across refreshes (Chrome / Edge). */

const DB_NAME = "inv.project";
const DB_VERSION = 1;
const STORE = "handles";
const DIR_KEY = "projectDir";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

export async function storeProjectDirHandle(
  handle: FileSystemDirectoryHandle
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(handle, DIR_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Failed to store folder handle"));
  });
  db.close();
}

export async function loadProjectDirHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDb();
    const handle = await new Promise<FileSystemDirectoryHandle | null>(
      (resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(DIR_KEY);
        req.onsuccess = () =>
          resolve((req.result as FileSystemDirectoryHandle | undefined) ?? null);
        req.onerror = () =>
          reject(req.error ?? new Error("Failed to load folder handle"));
      }
    );
    db.close();
    return handle;
  } catch {
    return null;
  }
}

export async function clearProjectDirHandle(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(DIR_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error("Failed to clear folder handle"));
    });
    db.close();
  } catch {
    // ignore
  }
}
