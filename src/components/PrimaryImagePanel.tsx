import { useState } from "react";
import {
  getItemDisplayImage,
  isUsableImageRef,
} from "../api/inventory/imageUtils";
import { Item } from "../api/inventory/types";
import { useInventory } from "../context/InventoryContext";
import ImageActionMenu from "./ImageActionMenu";
import ImageLightbox from "./ImageLightbox";
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
  const showingSomething = isUsableImageRef(shown);

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
      <ImageActionMenu
        large
        hasImage={showingSomething}
        busy={busy}
        emptyLabel="Click to add photo"
        preview={
          <ResolvedImage imageUrl={shown} alt={`${item.name} primary`} />
        }
        onFile={onFile}
        onClear={
          hasPrimary ? () => clearPrimaryImage(item.id) : undefined
        }
        onPreview={
          showingSomething
            ? () => {
                void resolveImageSrc(shown).then((src) => {
                  if (src) {
                    setPreview(src);
                  }
                });
              }
            : undefined
        }
      />
      <p className="field-hint">
        {hasPrimary
          ? "Custom primary. Click photo for gallery / camera / remove."
          : usingFallback
            ? "Showing first vendor photo. Click to set a custom primary."
            : "Click the placeholder for gallery or camera."}
      </p>
      {hasPrimary && hasProjectFolder ? (
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
