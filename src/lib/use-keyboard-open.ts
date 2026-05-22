"use client";

import { useEffect, useState } from "react";

// Returns true while a soft-keyboard-summoning element (text input, textarea,
// contentEditable) is focused. Mobile browsers shrink the visual viewport when
// the keyboard opens, which lifts position:fixed bars on top of the keyboard —
// callers use this signal to hide those bars while typing.
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function summonsKeyboard(el: EventTarget | null): boolean {
      if (!(el instanceof HTMLElement)) return false;
      if (el.isContentEditable) return true;
      if (el.tagName === "TEXTAREA") return true;
      if (el.tagName === "INPUT") {
        const type = (el as HTMLInputElement).type;
        return ![
          "button",
          "submit",
          "reset",
          "checkbox",
          "radio",
          "file",
          "color",
          "range",
          "date",
          "time",
          "month",
          "week",
          "datetime-local"
        ].includes(type);
      }
      return false;
    }

    function onFocusIn(e: FocusEvent) {
      if (summonsKeyboard(e.target)) setOpen(true);
    }

    function onFocusOut() {
      // Defer one tick so focus moving between inputs doesn't blink the nav.
      window.setTimeout(() => {
        setOpen(summonsKeyboard(document.activeElement));
      }, 0);
    }

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return open;
}
