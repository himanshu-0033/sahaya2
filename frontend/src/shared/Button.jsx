// The shared button.
//
// Two changes worth noting from the earlier version: the primary fill now uses
// dark text on teal rather than white, because white on this teal sits at about
// 2.4:1 and was the worst contrast in the app; and every variant carries the
// `press` class, so a tap is acknowledged on a phone where there is no hover to
// rely on.
export default function Button({
  children,
  variant = 'primary',
  size = 'default',
  className = '',
  ...props
}) {
  const base =
    'press w-full rounded-full font-medium transition-all duration-200 disabled:cursor-not-allowed';
  const sizes = {
    default: 'py-4',
    compact: 'py-3 text-sm',
  };
  const variants = {
    primary:
      'bg-[var(--color-teal)] text-[#07080a] hover:bg-[var(--color-teal-dark)] disabled:bg-[var(--surface-3)] disabled:text-[var(--ink-faint)]',
    secondary:
      'border border-[var(--line-2)] bg-[var(--surface-1)] text-[var(--color-ink)] hover:border-[var(--line-4)] hover:bg-[var(--surface-3)] disabled:opacity-40',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
