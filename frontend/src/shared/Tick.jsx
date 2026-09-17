// The printed form's tick box. The ink and the drawn stroke live in .f-tick
// (index.css); a parent carrying data-ticked="true" is what fills it.
export default function Tick() {
  return (
    <span className="f-tick" aria-hidden="true">
      <svg viewBox="0 0 16 16" fill="none">
        <path d="M3 8.6 6.4 12 13.2 4.4" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
