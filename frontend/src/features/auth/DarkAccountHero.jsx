import { Link } from 'react-router-dom';
import CrisisContacts from '../../shared/CrisisContacts.jsx';
import Logo from '../../shared/Logo.jsx';
import AccountForm from './AccountForm.jsx';

// The first screen after signing up: the four account questions.
//
// The name is kept so no caller had to change, but it is not dark any more. It
// was the last near-black screen in an app that is otherwise printed on white,
// and it is the very first page of that app a new student sees, so it sits on
// the same sheet as everything after it.
export default function DarkAccountHero({ name, email, onDone, saving, error }) {
  return (
    <div className="welcome min-h-screen">
      <div className="mx-auto max-w-xl px-6 py-8 md:py-12">
        <div className="flex items-center justify-between gap-4 border-b-2 border-[var(--spot)] pb-4">
          <div className="flex items-center gap-2.5">
            <Logo size={34} glow={false} />
            <div>
              <h1 className="f-title text-2xl leading-none text-[var(--spot)]">DP Sahay AI</h1>
              <p className="f-label mt-1.5">YOU MATTER TO US</p>
              <p className="marginalia mt-0.5">Daily Check-in</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <CrisisContacts variant="link" />
            <Link
              to="/caregiver"
              className="text-sm text-[var(--key-soft)] underline decoration-[var(--rule)] underline-offset-4 hover:text-[var(--spot)] hover:decoration-[var(--spot)]"
            >
              Caregiver
            </Link>
          </div>
        </div>

        <AccountForm name={name} email={email} onDone={onDone} saving={saving} error={error} />
      </div>
    </div>
  );
}
