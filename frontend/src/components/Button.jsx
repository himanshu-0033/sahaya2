export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'w-full rounded-full py-4 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-[var(--color-teal)] text-white hover:bg-[var(--color-teal-dark)]',
    secondary: 'bg-[var(--color-cream-soft)] text-[var(--color-ink)] border border-[var(--color-ink)]/10 hover:brightness-125',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
