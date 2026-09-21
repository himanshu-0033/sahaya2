import { Link } from 'react-router-dom';
import PageShell from '../../layouts/PageShell.jsx';
import Header from '../../layouts/Header.jsx';
import AccountForm from './AccountForm.jsx';

// The first screen after signing in, before the profile exists.
//
// It was the last dark screen in the app: black between the light sign-in page
// and the light home, so the first thing a new student met after signing in
// looked like a different product. It also carried its own masthead, which
// wrapped "DP Sahay AI" onto two lines on a phone, and its fields used the
// ink-tinted line and surface tokens, which vanish on black.
//
// The shared header brings the crisis control and the account link, so someone
// who signed in with the wrong account has a way to sign out. Tabs stay off:
// there is nowhere to go until the profile is saved.
export default function AccountSetup({ name, email, onDone, saving, error }) {
  return (
    <PageShell tabs={false} width="narrow">
      <Header eyebrow="Welcome" streak={false} standalone />

      <AccountForm name={name} email={email} onDone={onDone} saving={saving} error={error} />

      <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
        Here for someone else?{' '}
        <Link to="/caregiver" className="text-[var(--color-teal-dark)] underline underline-offset-4">
          Caregiver access
        </Link>
      </p>
    </PageShell>
  );
}
