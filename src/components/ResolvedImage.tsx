import { useEffect, useState } from "react";
import { useInventory } from "../context/InventoryContext";

type Props = {
  imageUrl?: string;
  alt: string;
  className?: string;
};

/** Resolves relative project paths via the open folder handle. */
export default function ResolvedImage({ imageUrl, alt, className }: Props) {
  const { resolveImageSrc } = useInventory();
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    void resolveImageSrc(imageUrl).then((url) => {
      if (!cancelled) {
        setSrc(url);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [imageUrl, resolveImageSrc]);

  if (!src) {
    return null;
  }
  return <img src={src} alt={alt} className={className} />;
}
