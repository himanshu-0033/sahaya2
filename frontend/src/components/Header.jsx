import { Link } from 'react-router-dom';
import CrisisContacts from './CrisisContacts.jsx';
import Logo from './Logo.jsx';
import { useSession } from '../lib/useSession.js';

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
export default function Header({ eyebrow = 'Daily check-in', leading = null }) {
  const session = useSession();
  const profile = session?.profile;
  // /account already holds the whole profile — name, email, who it is shared
  // with, and sign out. It was only reachable from a footer link called "Who
  // can see this", which nobody reads as "my account".
  return (
    <header className="flex items-center justify-between gap-3 pt-2 pb-1">
      <div className="flex min-w-0 items-center gap-3">
        <Link to="/" className="press group flex shrink-0 items-center gap-2.5">
          <Logo size={26} />
          <span className="block">
            {/* "DP Sahay" carries the weight and "AI" is set back, because
                the two halves are doing different jobs: one is the name, the
                other is a disclosure. Running them at the same weight would
                make "AI" look like part of the word. */}
            <span className="font-display block text-[1.2rem] leading-none sm:text-[1.3rem]">
              DP Sahay<span className="ml-1.5 text-[0.78em] text-[var(--color-teal)]">AI</span>
            </span>
            <span className="marginalia mt-1.5 block transition-colors group-hover:text-[var(--color-ink-soft)]">
              {eyebrow}
            </span>
          </span>
        </Link>
        {leading}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <CrisisContacts variant="link" />
        {profile && (
          <Link
            to="/account"
            aria-label="Your account"
            title={profile.name || 'Your account'}
            className="press flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--line-3)] bg-[var(--surface-2)] text-sm font-medium transition-colors hover:border-[var(--color-teal)]"
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
