type Props = {
  src: string;
  alt: string;
  onClose: () => void;
};

export default function ImageLightbox({ src, alt, onClose }: Props) {
  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt} />
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
