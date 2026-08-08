/** Shared-folder open/save helpers using the File System Access API (Chrome / Edge). */

export type CsvCell = string | number | undefined;
export type CsvRows = CsvCell[][];

const csvPickerTypes = [
  {
    description: "CSV",
    accept: { "text/csv": [".csv"], "text/plain": [".csv"] },
  },
];

export const isFileSystemAccessSupported = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.showOpenFilePicker === "function" &&
  typeof window.showSaveFilePicker === "function";

export function rowsToCsvString(rows: CsvRows): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = cell === undefined || cell === null ? "" : String(cell);
          if (/[",\n\r]/.test(s)) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        })
        .join(",")
    )
    .join("\r\n");
}

/** Parse CSV text with support for quoted commas and newlines. */
export function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cell += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (c === "\r") {
      // ignore
    } else {
      cell += c;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""));
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

function isAbortError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name: string }).name === "AbortError"
  );
}

export async function openCsvFile(): Promise<{
  handle: FileSystemFileHandle;
  rows: string[][];
  name: string;
} | null> {
  if (!window.showOpenFilePicker) {
    return null;
  }
  try {
    const [handle] = await window.showOpenFilePicker({
      multiple: false,
      types: csvPickerTypes,
    });
    if (!(await ensurePermission(handle, "read"))) {
      throw new Error("Permission to read the file was denied.");
    }
    const file = await handle.getFile();
    const text = await file.text();
    return { handle, rows: parseCsvText(text), name: handle.name };
  } catch (err: unknown) {
    if (isAbortError(err)) {
      return null;
    }
    throw err;
  }
}

export async function saveCsvToHandle(
  handle: FileSystemFileHandle,
  rows: CsvRows
): Promise<void> {
  if (!(await ensurePermission(handle, "readwrite"))) {
    throw new Error("Permission to write the file was denied.");
  }
  const writable = await handle.createWritable();
  await writable.write(rowsToCsvString(rows));
  await writable.close();
}

export async function saveCsvAs(
  rows: CsvRows,
  suggestedName: string
): Promise<{ handle: FileSystemFileHandle; name: string } | null> {
  if (!window.showSaveFilePicker) {
    return null;
  }
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName,
      types: csvPickerTypes,
    });
    await saveCsvToHandle(handle, rows);
    return { handle, name: handle.name };
  } catch (err: unknown) {
    if (isAbortError(err)) {
      return null;
    }
    throw err;
  }
}

/** Fallback download when File System Access API is unavailable. */
export function downloadCsv(rows: CsvRows, filename: string): void {
  const blob = new Blob([rowsToCsvString(rows)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Fallback open via hidden file input. */
export function openCsvViaInput(): Promise<{ rows: string[][]; name: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,text/csv";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const text = await file.text();
      resolve({ rows: parseCsvText(text), name: file.name });
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}
