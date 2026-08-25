export default function FlagBadge({ resident }) {
  // A positive risk screen outranks everything else on this badge. Someone
  // saying the thoughts are happening right now outranks that in turn — the
  // two need to be distinguishable at a glance in a list of forty rows.
  const risk = resident.riskScreen;
  if (risk?.recent && risk.level === 'acute') {
    return (
      <span className="whitespace-nowrap rounded-full bg-[var(--color-flag)] px-3 py-1 text-xs font-medium text-white">
        At risk now
      </span>
    );
  }
  if (risk?.recent) {
    return (
      <span className="whitespace-nowrap rounded-full bg-[var(--color-flag-soft)] px-3 py-1 text-xs text-[var(--color-flag)] ring-1 ring-[var(--color-flag)]/40">
        Risk screen positive
      </span>
    );
  }
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
