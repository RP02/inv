import type { FocusEvent } from "react";

/** Select all text when an editable cell receives focus (click or tab). */
export function selectOnFocus(
  e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>
): void {
  const el = e.currentTarget;
  requestAnimationFrame(() => {
    el.select();
  });
}
