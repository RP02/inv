import { useState } from "react";
import {
  getItemDisplayImage,
  isUsableImageRef,
} from "../api/inventory/imageUtils";
import { Item } from "../api/inventory/types";
import { useInventory } from "../context/InventoryContext";
import ImageLightbox from "./ImageLightbox";
import ImagePicker from "./ImagePicker";
import ResolvedImage from "./ResolvedImage";

type Props = {
  item: Item;
};

export default function PrimaryImagePanel({ item }: Props) {
  const {
    uploadPrimaryImage,
    clearPrimaryImage,
    hasProjectFolder,
    resolveImageSrc,
  } = useInventory();
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const hasPrimary = isUsableImageRef(item.primaryImageUrl);
  const fallback = getItemDisplayImage({
    primaryImageUrl: undefined,
    offers: item.offers,
  });
  const shown = hasPrimary ? item.primaryImageUrl : fallback;
  const usingFallback = !hasPrimary && !!fallback;

  const onFile = async (file: File) => {
    setBusy(true);
    try {
      await uploadPrimaryImage(item, file);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Could not save primary image.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="primary-image-panel">
      <div className="primary-image-label">Primary catalog photo</div>
      <button
        type="button"
        className="primary-image-frame"
        onClick={() => {
          if (!shown) {
            return;
          }
          void resolveImageSrc(shown).then((src) => {
            if (src) {
              setPreview(src);
            }
          });
        }}
      >
        {shown ? (
          <ResolvedImage imageUrl={shown} alt={`${item.name} primary`} />
        ) : (
          <span className="primary-image-empty">
            Use Gallery or Camera below
          </span>
        )}
      </button>
      <p className="field-hint">
        {hasPrimary
          ? "Custom primary (JPEG/PNG/WebP). Separate from vendor photos."
          : usingFallback
            ? "Showing first vendor photo. Upload a different primary anytime."
            : "JPEG, PNG, WebP, GIF. On phone: Camera takes a photo instantly."}
      </p>
      <ImagePicker busy={busy} hasImage={hasPrimary} onFile={onFile} />
      {hasPrimary ? (
        <button
          type="button"
          className="secondary"
          onClick={() => clearPrimaryImage(item.id)}
        >
          Clear (use first vendor photo)
        </button>
      ) : null}
      {!hasProjectFolder ? (
        <span className="thumb-note">
          Tip: Open folder on desktop so photos save under images/…
        </span>
      ) : hasPrimary ? (
        <span className="thumb-note" title={item.primaryImageUrl}>
          {item.primaryImageUrl}
        </span>
      ) : null}
      {preview ? (
        <ImageLightbox
          src={preview}
          alt={`${item.name} primary`}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </div>
  );
}
