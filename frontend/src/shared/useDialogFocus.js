import { useEffect, useRef } from 'react';

// Focus management for the app's two modal dialogs.
//
// Both of them unmount their own trigger button while they are open, so
// without this the browser has nowhere to put focus and drops it on <body>:
// a keyboard or screen-reader user opens the dialog and lands nowhere, and
// Tab walks the page behind the overlay instead of the dialog in front of it.
// Escape already worked; this is the rest of the contract that role="dialog"
// and aria-modal="true" promise.
//
// Attach `dialogRef` to the dialog's content box and `triggerRef` to the
// control that opens it.
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function useDialogFocus(open) {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open) {
      // Closing. React has just remounted the trigger, so this is a fresh
      // node rather than the one that was focused when the dialog opened —
      // which is why the trigger is tracked by ref rather than by
      // remembering document.activeElement.
      if (wasOpen.current) {
        wasOpen.current = false;
        triggerRef.current?.focus();
      }
      return undefined;
    }

    wasOpen.current = true;
    const node = dialogRef.current;
    if (!node) return undefined;

    const items = () => [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    items()[0]?.focus();

    // Tab off either end wraps back inside, so the overlay is a real modal
    // rather than a picture of one.
    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      const list = items();
      if (list.length === 0) return;
      const edge = e.shiftKey ? list[0] : list[list.length - 1];
      if (document.activeElement === edge || !node.contains(document.activeElement)) {
        e.preventDefault();
        (e.shiftKey ? list[list.length - 1] : list[0]).focus();
      }
    };

    node.addEventListener('keydown', onKey);
    return () => node.removeEventListener('keydown', onKey);
  }, [open]);

  return { dialogRef, triggerRef };
}
