import { useEffect, useRef, useState } from 'react';

// True once the element has scrolled into view, and then for good: a part of
// the page is printed once, and printing it again every time it scrolls past
// would be the page fighting its reader.
//
// Starts true under reduced motion, and wherever IntersectionObserver is
// missing, so nothing waits hidden for an observer that will never fire.
export default function useReveal({ margin = '0px 0px -12% 0px' } = {}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(
    () =>
      typeof window === 'undefined' ||
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const el = ref.current;
    if (shown || !el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        io.disconnect();
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown, margin]);

  return [ref, shown];
}
