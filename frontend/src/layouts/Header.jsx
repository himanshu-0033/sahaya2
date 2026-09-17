import { Link } from 'react-router-dom';
import CrisisContacts from '../shared/CrisisContacts.jsx';
import StreakBadge from '../shared/StreakBadge.jsx';
import Logo from '../shared/Logo.jsx';
import { useSession } from '../features/auth/useSession.js';

// A slim masthead: the wordmark and the one link that has to be reachable from
// every screen.
//
// It used to also carry the navigation. TabBar owns that now, and leaving the
// links in both places meant a student saw "Calm down" twice on the same
// screen and had to work out whether they were the same thing. The crisis link
// stays here rather than moving to the tab bar because it is not a
// destination you browse to — it is an interruption, and it belongs at the
// edge of the page, not in the same row as "Tests".

// `leading` sits in the left corner beside the wordmark, for the one screen
// that has a shortcut worth putting there. It is a slot rather than a fixed
// button because this masthead is on every page, and a Tests button on the
// Tests page would be a link to where you already are.
// `streak` is off on Home, where the day card carries the streak itself; two of
// the same badge a few pixels apart read as two different numbers.
// `standalone` keeps the masthead on at laptop width. It is normally hidden
// there because the sidebar carries the wordmark, but a page rendered without
// the sidebar (a signed-out article) then had no masthead at all, and so no
// wordmark, no crisis link and no way back to the landing page.
export default function Header({ eyebrow = 'Daily check-in', leading = null, streak = true, standalone = false }) {
  const session = useSession();
  const profile = session?.profile;
  // /account already holds the whole profile — name, email, who it is shared
  // with, and sign out. It was only reachable from a footer link called "Who
  // can see this", which nobody reads as "my account".
  return (
    <header className={`flex items-center justify-between gap-3 border-b-2 border-[var(--spot)] pt-2 pb-2.5 ${standalone ? '' : 'md:hidden'}`}>
      <div className="flex min-w-0 items-center gap-3">
        {/* min-w-0 and truncate, so on a narrow phone the name gives way rather
            than the controls on the right being drawn on top of it. */}
        <Link to="/" className="press group flex min-w-0 items-center gap-2">
          <Logo size={26} glow={false} />
          <span className="block min-w-0">
            {/* "DP Sahay" carries the weight and "AI" is set back, because
                the two halves are doing different jobs: one is the name, the
                other is a disclosure. Running them at the same weight would
                make "AI" look like part of the word. */}
            <span className="f-title block truncate text-[1.2rem] leading-none text-[var(--spot)] sm:text-[1.3rem]">
              DP Sahay<span className="ml-1.5 text-[0.78em] max-[399px]:hidden">AI</span>
            </span>
            <span className="marginalia mt-1.5 block transition-colors group-hover:text-[var(--spot)]">
              {eyebrow}
            </span>
          </span>
        </Link>
        {leading}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {streak && <StreakBadge compact />}
        <CrisisContacts variant="link" compact />
        {profile && (
          <Link
            to="/account"
            aria-label="Your account"
            title={profile.name || 'Your account'}
            className="press flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden border border-[var(--spot)] bg-[var(--paper-tint)] text-sm font-semibold text-[var(--spot)] transition-colors hover:bg-[var(--spot-wash)]"
          >
            {profile.picture ? (
              <img src={profile.picture} alt="" className="h-full w-full object-cover" />
            ) : (
              (profile.name || '?').charAt(0).toUpperCase()
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
