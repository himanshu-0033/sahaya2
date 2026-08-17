export default function InkblotPlate({ path, size = 220 }) {
  return (
    <svg
      viewBox="-100 -100 200 200"
      width={size}
      height={size}
      role="img"
      aria-label="Abstract ink blot shape"
    >
      <path d={path} fill="var(--color-ink)" opacity="0.82" />
      <path d={path} fill="var(--color-ink)" opacity="0.82" transform="scale(-1,1)" />
    </svg>
  );
}
