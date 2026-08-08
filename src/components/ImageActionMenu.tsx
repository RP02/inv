import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { imageAcceptAttr } from "../api/inventory/imageUtils";
import { IconCamera, IconImage, IconTrash } from "./Icons";

type Props = {
  hasImage: boolean;
  busy?: boolean;
  /** Larger hit target for primary panel */
  large?: boolean;
  preview?: ReactNode;
  emptyLabel?: string;
  onFile: (file: File) => void | Promise<void>;
  onClear?: () => void;
  onPreview?: () => void;
};

type MenuPos = {
  top: number;
  left: number;
  maxHeight?: number;
};

export default function ImageActionMenu({
  hasImage,
  busy,
  large,
  preview,
  emptyLabel = "Add photo",
  onFile,
  onClear,
  onPreview,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hitRef = useRef<HTMLButtonElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const placeMenu = () => {
    const hit = hitRef.current;
    if (!hit) {
      return;
    }
    const rect = hit.getBoundingClientRect();
    const menuEl = menuRef.current;
    const menuHeight = menuEl?.offsetHeight ?? 96;
    const menuWidth = menuEl?.offsetWidth ?? 168;
    const gap = 4;
    const pad = 8;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    // Prefer below; flip up when below can't fit and above has more room
    const openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;

    let left = rect.left;
    if (left + menuWidth > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - menuWidth - pad);
    }

    let top = openUp
      ? rect.top - gap - menuHeight
      : rect.bottom + gap;
    const maxTop = window.innerHeight - menuHeight - pad;
    top = Math.min(Math.max(pad, top), Math.max(pad, maxTop));

    const available = window.innerHeight - top - pad;
    const next: MenuPos = { top, left };
    if (menuHeight > available) {
      next.maxHeight = Math.max(72, available);
    }
    setPos(next);
  };

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    placeMenu();
    // Remeasure after menu paints with real height
    const id = requestAnimationFrame(() => placeMenu());
    return () => cancelAnimationFrame(id);
  }, [open, hasImage]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onReposition = () => placeMenu();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  const handle = async (
    file: File | undefined,
    input: HTMLInputElement | null
  ) => {
    if (!file) {
      return;
    }
    try {
      await onFile(file);
    } finally {
      if (input) {
        input.value = "";
      }
      setOpen(false);
    }
  };

  const toggle = () => {
    if (open) {
      setOpen(false);
      setPos(null);
      return;
    }
    const hit = hitRef.current;
    if (hit) {
      const rect = hit.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(true);
  };

  const menu =
    open && pos
      ? createPortal(
          <div
            ref={menuRef}
            className="image-action-menu portal"
            role="menu"
            style={{
              top: pos.top,
              left: pos.left,
              maxHeight: pos.maxHeight,
              overflowY: pos.maxHeight ? "auto" : undefined,
            }}
          >
            {hasImage && onPreview ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onPreview();
                }}
              >
                View full size
              </button>
            ) : null}
            <button
              type="button"
              role="menuitem"
              disabled={busy}
              onClick={() => galleryRef.current?.click()}
            >
              <IconImage size={16} /> Gallery
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={busy}
              onClick={() => cameraRef.current?.click()}
            >
              <IconCamera size={16} /> Camera
            </button>
            {hasImage && onClear ? (
              <button
                type="button"
                role="menuitem"
                className="danger"
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
              >
                <IconTrash size={16} /> Remove photo
              </button>
            ) : null}
          </div>,
          document.body
        )
      : null;

  return (
    <div
      className={large ? "image-action large" : "image-action"}
      ref={rootRef}
    >
      <button
        ref={hitRef}
        type="button"
        className={hasImage ? "image-action-hit has-image" : "image-action-hit"}
        disabled={busy}
        title={hasImage ? "Photo options" : "Add photo"}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      >
        {hasImage ? (
          preview
        ) : (
          <span className="image-action-empty">{emptyLabel}</span>
        )}
      </button>

      {menu}

      <input
        ref={galleryRef}
        type="file"
        accept={imageAcceptAttr()}
        hidden
        onChange={(e) => void handle(e.target.files?.[0], galleryRef.current)}
      />
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
