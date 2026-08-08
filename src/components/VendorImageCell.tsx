import { useState } from "react";
import { isUsableImageRef } from "../api/inventory/imageUtils";
import { Item, VendorOffer } from "../api/inventory/types";
import { useInventory } from "../context/InventoryContext";
import ImageActionMenu from "./ImageActionMenu";
import ImageLightbox from "./ImageLightbox";
import ResolvedImage from "./ResolvedImage";

type Props = {
  item: Item;
  offer: VendorOffer;
  onChange: (offer: VendorOffer) => void;
};

export default function VendorImageCell({ item, offer, onChange }: Props) {
  const { uploadOfferImage, clearOfferImage, resolveImageSrc } = useInventory();
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
      <ImageActionMenu
        hasImage={hasImage}
        busy={busy}
        emptyLabel="+"
        preview={
          <ResolvedImage
            imageUrl={offer.imageUrl}
            alt={`${offer.vendor} product`}
          />
        }
        onFile={onFile}
        onClear={() => void clearOfferImage(item, offer)}
        onPreview={() => void openPreview()}
      />
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
