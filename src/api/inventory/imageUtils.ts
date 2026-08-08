/** Resize / normalize uploads. Keeps PNG/WebP when useful; JPEG for photos. */

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;
const WEBP_QUALITY = 0.82;

export type ProcessedImage = {
  blob: Blob;
  ext: "jpg" | "png" | "webp" | "gif";
  mimeType: string;
};

const ACCEPT_IMAGE =
  "image/*,image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";

export function imageAcceptAttr(): string {
  return ACCEPT_IMAGE;
}

function extFromMimeAndName(mime: string, fileName: string): ProcessedImage["ext"] {
  const m = mime.toLowerCase();
  if (m.includes("png")) {
    return "png";
  }
  if (m.includes("webp")) {
    return "webp";
  }
  if (m.includes("gif")) {
    return "gif";
  }
  if (m.includes("jpeg") || m.includes("jpg")) {
    return "jpg";
  }
  const fromName = fileName.split(".").pop()?.toLowerCase();
  if (fromName === "png" || fromName === "webp" || fromName === "gif") {
    return fromName;
  }
  if (fromName === "jpg" || fromName === "jpeg") {
    return "jpg";
  }
  return "jpg";
}

export function isSupportedImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) {
    // HEIC often fails in browsers — still attempt decode later
    return true;
  }
  return /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name);
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error(
          "Could not read that image. Try JPEG, PNG, or WebP (HEIC may not work in this browser)."
        )
      );
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode image"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

/** Resize and encode, preserving format when practical. */
export async function processImageFile(file: File): Promise<ProcessedImage> {
  if (!isSupportedImageFile(file)) {
    throw new Error("Please choose an image (JPEG, PNG, WebP, or GIF).");
  }

  const img = await loadImageFromFile(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas not available");
  }

  // White background for formats that may have transparency when converting to JPEG
  const sourceExt = extFromMimeAndName(file.type, file.name);
  let outExt: ProcessedImage["ext"] = sourceExt;
  let mimeType = "image/jpeg";
  let quality: number | undefined = JPEG_QUALITY;

  if (sourceExt === "png") {
    outExt = "png";
    mimeType = "image/png";
    quality = undefined;
  } else if (sourceExt === "webp") {
    outExt = "webp";
    mimeType = "image/webp";
    quality = WEBP_QUALITY;
  } else if (sourceExt === "gif") {
    // Animated GIF becomes a still PNG via canvas
    outExt = "png";
    mimeType = "image/png";
    quality = undefined;
  } else {
    outExt = "jpg";
    mimeType = "image/jpeg";
    quality = JPEG_QUALITY;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
  }

  ctx.drawImage(img, 0, 0, w, h);

  try {
    const blob = await canvasToBlob(canvas, mimeType, quality);
    return { blob, ext: outExt, mimeType };
  } catch {
    // WebP encode unsupported in some browsers — fall back to JPEG
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
    return { blob, ext: "jpg", mimeType: "image/jpeg" };
  }
}

/** Fallback when no project folder is open. */
export async function fileToResizedDataUrl(file: File): Promise<string> {
  const { blob } = await processImageFile(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to encode data URL"));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(blob);
  });
}

/** @deprecated use processImageFile — kept for any leftover imports */
export async function fileToResizedJpegBlob(file: File): Promise<Blob> {
  const processed = await processImageFile(file);
  return processed.blob;
}

export function isUsableImageRef(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  return (
    value.startsWith("data:image/") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/") ||
    value.startsWith("images/") ||
    (!value.includes("://") && value.includes("/"))
  );
}

/** Card/list face: explicit primary, else first vendor photo. */
export function getItemDisplayImage(item: {
  primaryImageUrl?: string;
  offers: Array<{ imageUrl?: string }>;
}): string | undefined {
  if (isUsableImageRef(item.primaryImageUrl)) {
    return item.primaryImageUrl;
  }
  return item.offers.find((o) => isUsableImageRef(o.imageUrl))?.imageUrl;
}
