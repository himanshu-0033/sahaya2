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
// an achievement to display back at somebody, and a flame beside a 0 reads as a scolding
// on the exact day someone is least able to take one.
export const CHECKIN_EVENT = 'sahaya:checkin';

// `label` adds the word after the number ("4 days"), for the one place with
// room to say it: the day card on Home.
// `compact` is the phone header, where every pixel beside the name counts.
export default function StreakBadge({ className = '', label = false, compact = false }) {
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
      title={checkedIn ? `${days} in a row` : `${days} in a row, today is still open`}
      aria-label={
        checkedIn
          ? `Check-in streak: ${days}`
          : `Check-in streak: ${days}. Today's check-in is not done yet.`
      }
      className={`press flex shrink-0 items-center border border-[var(--rule)] bg-[var(--paper)] ${compact ? 'gap-1 px-2 py-1 text-xs' : 'gap-1.5 px-2.5 py-1.5 text-sm'} font-semibold text-[var(--spot)] transition-colors hover:border-[var(--spot)] hover:bg-[var(--paper-tint)] ${className}`}
    >
      {/* A drawn flame in the spot ink rather than the emoji, which arrived in
          whatever colour the phone's emoji font chose and was the one
          full-colour picture left on the sheet. */}
      <svg
        viewBox="0 0 24 24"
        width={compact ? 13 : 15}
        height={compact ? 13 : 15}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="shrink-0"
      >
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
      <span className="leading-none tabular-nums">{label ? days : streak}</span>
    </Link>
  );
}
