import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// A two-part cursor: a hard dot that tracks the pointer exactly, and a ring
// that chases it with easing. The lag is the whole effect — it gives weight to
// something that normally has none.
//
// Rules this follows, because a custom cursor is the easiest thing in a
// redesign to get wrong:
//
//   * POINTER DEVICES ONLY. Mounted behind a `(hover: hover) and
//     (pointer: fine)` check, so a phone never pays for it and never ends up
//     with a stray dot parked in a corner.
//   * THE NATIVE CURSOR IS ONLY HIDDEN ONCE OURS IS DRAWING. The class that
//     sets `cursor: none` is added from JS after the first pointer move. If
//     this component never runs, the normal arrow is still there.
//   * TEXT KEEPS ITS CARET. Inputs and textareas re-enable the native cursor
//     in CSS — replacing an I-beam with a dot makes a form feel broken.
//   * IT RESPECTS REDUCED MOTION by dropping the easing and pinning the ring
//     to the dot, rather than by disappearing.
//
// Position is written straight to the DOM node in a rAF loop rather than
// through state: this runs on every mouse move, and re-rendering React 120
// times a second to move two divs would be the most expensive thing on the
// page.

const SECTION_HUE = [
  ['/paths', 'var(--sec-paths)'],
  ['/grounding', 'var(--sec-calm)'],
  ['/assessments', 'var(--sec-tests)'],
  ['/inkblot-test', 'var(--sec-inkblot)'],
  ['/read', 'var(--sec-read)'],
];

function hueFor(pathname) {
  const match = SECTION_HUE.find(([prefix]) => pathname.startsWith(prefix));
  return match ? match[1] : 'var(--sec-home)';
}

export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!fine.matches) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return undefined;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let frame;
    let visible = false;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) {
        visible = true;
        document.documentElement.classList.add('has-custom-cursor');
        dot.style.opacity = '1';
        ring.style.opacity = '1';
      }
    };

    // Grow the ring over anything clickable. Checked with closest() on the
    // event target so it still fires for a label or an icon inside a button.
    const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, label';
    const onOver = (e) => {
      const hit = e.target.closest?.(INTERACTIVE);
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${hit ? 1.9 : 1})`;
      ring.dataset.hot = hit ? 'true' : 'false';
    };

    const onLeave = () => {
      visible = false;
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    };

    const onDown = () => { ring.dataset.down = 'true'; };
    const onUp = () => { ring.dataset.down = 'false'; };

    const tick = () => {
      // Exponential ease toward the pointer. 0.18 is slow enough to read as
      // a trail, fast enough that it never feels laggy on a real click.
      const ease = reduced ? 1 : 0.18;
      ringX += (mouseX - ringX) * ease;
      ringY += (mouseY - ringY) * ease;

      const scale = ring.dataset.down === 'true' ? 0.8 : ring.dataset.hot === 'true' ? 1.9 : 1;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${scale})`;

      frame = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
      document.documentElement.classList.remove('has-custom-cursor');
    };
  }, []);

  const hue = hueFor(pathname);

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[9999] h-1.5 w-1.5 rounded-full opacity-0 mix-blend-difference"
        style={{ background: '#fff', transition: 'opacity 0.25s ease' }}
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        data-hot="false"
        data-down="false"
        className="pointer-events-none fixed top-0 left-0 z-[9998] h-8 w-8 rounded-full opacity-0"
        style={{
          border: `1px solid ${hue}`,
          // The colour transition is what makes moving between sections feel
          // intentional rather than abrupt.
          transition: 'opacity 0.25s ease, border-color 0.6s ease, background-color 0.3s ease',
          background: `color-mix(in srgb, ${hue} 10%, transparent)`,
        }}
      />
    </>
  );
}
