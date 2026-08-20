export default function FlagBadge({ resident }) {
  if (resident.flaggedRecently) {
    return (
      <span className="whitespace-nowrap rounded-full bg-[var(--color-flag-soft)] px-3 py-1 text-xs text-[var(--color-flag)]">
        Needs a conversation
      </span>
    );
  }
  if (resident.invited && !resident.onboarded) {
    return (
      <span className="whitespace-nowrap rounded-full bg-[var(--color-lavender-soft)] px-3 py-1 text-xs text-[var(--color-lavender)]">
        Invited
      </span>
    );
  }
  if (!resident.lastCheckIn) {
    return (
      <span className="whitespace-nowrap rounded-full bg-white/5 px-3 py-1 text-xs text-[var(--color-muted)]">
        No check-ins
      </span>
    );
  }
  return (
    <span className="whitespace-nowrap rounded-full bg-[var(--color-teal-soft)] px-3 py-1 text-xs text-[var(--color-teal-dark)]">
      Steady
    </span>
  );
}
