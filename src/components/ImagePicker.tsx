import { useRef } from "react";
import { imageAcceptAttr } from "../api/inventory/imageUtils";

type Props = {
  busy?: boolean;
  hasImage?: boolean;
  onFile: (file: File) => void | Promise<void>;
  /** Compact layout for vendor table cells */
  compact?: boolean;
};

/**
 * Gallery + Camera pickers. On phones, Camera opens the device camera;
 * Gallery opens the photo library / file picker. Desktop uses file dialogs.
 */
export default function ImagePicker({
  busy,
  hasImage,
  onFile,
  compact,
}: Props) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handle = async (file: File | undefined, input: HTMLInputElement | null) => {
    if (!file) {
      return;
    }
    try {
      await onFile(file);
    } finally {
      if (input) {
        input.value = "";
      }
    }
  };

  return (
    <div className={compact ? "image-picker compact" : "image-picker"}>
      <button
        type="button"
        className="image-picker-btn"
        disabled={busy}
        onClick={() => galleryRef.current?.click()}
      >
        {busy ? "…" : hasImage ? "Gallery" : "Gallery"}
      </button>
      <button
        type="button"
        className="image-picker-btn accent"
        disabled={busy}
        onClick={() => cameraRef.current?.click()}
      >
        {busy ? "…" : "Camera"}
      </button>
      <input
        ref={galleryRef}
        type="file"
        accept={imageAcceptAttr()}
        hidden
        onChange={(e) =>
          void handle(e.target.files?.[0], galleryRef.current)
        }
      />
      {/* capture=environment prefers rear camera on phones */}
      <input
        ref={cameraRef}
        type="file"
        accept={imageAcceptAttr()}
        capture="environment"
        hidden
        onChange={(e) => void handle(e.target.files?.[0], cameraRef.current)}
      />
    </div>
  );
}
