import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStatus } from './api.js';
import { useSession } from '../features/auth/useSession.js';

// The streak, in the bar that is on every screen.
//
// It used to live only inside the check-in card on Home, which is the one
// place you have already seen it — a number you keep is worth carrying to the
// screens where you might be about to break it.
//
// Hidden below one day rather than showing a zero. A streak of nothing is not
// an achievement to display back at somebody, and "🔥 0" reads as a scolding
// on the exact day someone is least able to take one.
export const CHECKIN_EVENT = 'sahaya:checkin';

export default function StreakBadge({ className = '' }) {
  const session = useSession();
  const [streak, setStreak] = useState(0);
  const [checkedIn, setCheckedIn] = useState(true);

  useEffect(() => {
    if (!session) {
      setStreak(0);
      return undefined;
    }


    let alive = true;
    const load = () => {
      getStatus()
        .then((data) => {
          if (!alive) return;
          setStreak(Number(data?.streak) || 0);
          setCheckedIn(Boolean(data?.checkedIn));
        })
        // A streak that will not load is not worth an error anywhere. It simply
        // does not appear.
        .catch(() => {});
    };

    load();
    // Checking in is the only thing that moves this number, and it happens on
    // another screen. An event rather than refetching on every navigation:
    // one request when it can actually have changed, instead of one per page.
    window.addEventListener(CHECKIN_EVENT, load);
    return () => {
      alive = false;
      window.removeEventListener(CHECKIN_EVENT, load);
    };
  }, [session]);

  if (streak < 1) return null;

  // Where it goes depends on whether today is done. A streak of five with
  // today still open is a streak about to break, and the useful thing to hand
  // someone is the check-in, not a page about yesterday.
  const days = `${streak} ${streak === 1 ? 'day' : 'days'}`;

  return (
    <Link
      to={checkedIn ? '/results' : '/checkin'}
      title={checkedIn ? `${days} in a row` : `${days} in a row — today is still open`}
      aria-label={
        checkedIn
          ? `Check-in streak: ${days}`
          : `Check-in streak: ${days}. Today's check-in is not done yet.`
      }
      className={`press flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-amber)]/40 bg-[var(--color-amber)]/12 px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-amber)]/70 ${className}`}
    >
      <span aria-hidden="true" className="text-base leading-none">
        🔥
      </span>
      <span className="leading-none tabular-nums">{streak}</span>
    </Link>
  );
}
