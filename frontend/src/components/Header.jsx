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

export default function Header({ eyebrow = 'Daily check-in' }) {
  return (
    <header className="flex items-end justify-between gap-4 pt-2 pb-1">
      <Link to="/" className="press group block">
        <span className="font-display block text-[1.35rem] leading-none">
          Sahay<span className="text-[var(--color-teal)]">.</span>
        </span>
        <span className="marginalia mt-1.5 block transition-colors group-hover:text-[var(--color-ink-soft)]">
          {eyebrow}
        </span>
      </Link>
      <CrisisContacts variant="link" />
    </header>
  );
}
