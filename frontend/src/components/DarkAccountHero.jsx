import { Link } from 'react-router-dom';
import CrisisContacts from './CrisisContacts.jsx';
import AccountForm from './AccountForm.jsx';

export default function DarkAccountHero({ name, email, onDone, saving, error }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07080a]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% -5%, rgba(3,132,111,0.16), transparent 65%), radial-gradient(ellipse 50% 40% at 85% 20%, rgba(141,132,201,0.14), transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-xl px-6 py-8 md:py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-white">DP Sahay AI</h1>
            <p className="font-eyebrow mt-1 text-[10px] tracking-[0.22em] text-white/40">
              YOU MATTER TO US
            </p>
            <p className="mt-1 text-xs tracking-[0.2em] text-white/40 uppercase">Daily Check-in</p>
          </div>
          <div className="flex items-center gap-5">
            <CrisisContacts variant="link" dark />
            <Link to="/caregiver" className="text-sm text-white/60 underline underline-offset-4 hover:text-white">
              Caregiver
            </Link>
          </div>
        </div>

        <AccountForm name={name} email={email} onDone={onDone} saving={saving} error={error} dark />
      </div>
    </div>
  );
}
