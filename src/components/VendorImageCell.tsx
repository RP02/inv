import { useState } from "react";
import { isUsableImageRef } from "../api/inventory/imageUtils";
import { Item, VendorOffer } from "../api/inventory/types";
import { useInventory } from "../context/InventoryContext";
import ImageLightbox from "./ImageLightbox";
import ImagePicker from "./ImagePicker";
import ResolvedImage from "./ResolvedImage";

type Props = {
  item: Item;
  offer: VendorOffer;
  onChange: (offer: VendorOffer) => void;
};

export default function VendorImageCell({ item, offer, onChange }: Props) {
  const { uploadOfferImage, hasProjectFolder, resolveImageSrc } = useInventory();
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const hasImage = isUsableImageRef(offer.imageUrl);

  const onFile = async (file: File) => {
    setBusy(true);
    try {
      await uploadOfferImage(item, offer, file);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Could not save that image.");
    } finally {
      setBusy(false);
    }
  };

  const openPreview = async () => {
    const src = await resolveImageSrc(offer.imageUrl);
    if (src) {
      setPreview(src);
    }
  };

  return (
    <div className="vendor-image-cell">
      {hasImage ? (
        <button
          type="button"
          className="thumb-btn"
          title={offer.imageUrl}
          onClick={() => void openPreview()}
        >
          <ResolvedImage
            imageUrl={offer.imageUrl}
            alt={`${offer.vendor} product`}
          />
        </button>
      ) : (
        <div className="thumb-empty">—</div>
      )}
      <ImagePicker
        compact
        busy={busy}
        hasImage={hasImage}
        onFile={onFile}
      />
      {hasImage ? (
        <button
          type="button"
          className="secondary thumb-clear"
          onClick={() => onChange({ ...offer, imageUrl: undefined })}
        >
          Clear
        </button>
      ) : null}
      {!hasProjectFolder ? (
        <span className="thumb-note">no folder</span>
      ) : (
        <span className="thumb-note" title={offer.imageUrl}>
          {offer.imageUrl?.startsWith("images/") ? "on disk" : ""}
        </span>
      )}
      {preview ? (
        <ImageLightbox
          src={preview}
          alt={`${offer.vendor} product`}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </div>
  );
}
