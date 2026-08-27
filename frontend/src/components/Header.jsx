import { Link } from 'react-router-dom';
import CrisisContacts from './CrisisContacts.jsx';

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
  return (
    <header className="flex items-center justify-between gap-3 pt-2 pb-1">
      <div className="flex min-w-0 items-center gap-3">
        <Link to="/" className="press group block shrink-0">
          <span className="font-display block text-[1.35rem] leading-none">
            Sahay<span className="text-[var(--color-teal)]">.</span>
          </span>
          <span className="marginalia mt-1.5 block transition-colors group-hover:text-[var(--color-ink-soft)]">
            {eyebrow}
          </span>
        </Link>
        {leading}
      </div>
      <CrisisContacts variant="link" />
    </header>
  );
}
