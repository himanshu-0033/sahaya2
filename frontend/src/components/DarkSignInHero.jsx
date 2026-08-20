import { Link } from 'react-router-dom';
import GoogleSignInButton from './GoogleSignInButton.jsx';
import PhoneSignInButton from './PhoneSignInButton.jsx';
import PasswordAuthForm from './PasswordAuthForm.jsx';
import CrisisContacts from './CrisisContacts.jsx';
import Inkblot3D from './Inkblot3D.jsx';

const CARD_WIDTH = 368;

export default function DarkSignInHero({ onSignedIn }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07080a]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% -5%, rgba(3,132,111,0.16), transparent 65%), radial-gradient(ellipse 50% 40% at 85% 20%, rgba(141,132,201,0.12), transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: 'min(115vh, 140vw, 900px)' }}
        aria-hidden="true"
      >
        <Inkblot3D spin className="w-full opacity-40" />
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 60% at 50% 52%, rgba(7,8,10,0.88), rgba(7,8,10,0.5) 55%, rgba(7,8,10,0.2))',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-5">
        <header className="flex shrink-0 items-center justify-between">
          <div>
            <h1 className="font-display text-lg text-white">Sahay AI</h1>
            <p className="mt-0.5 text-[10px] tracking-[0.22em] text-white/35 uppercase">
              Daily Check-in
            </p>
          </div>
          <div className="flex items-center gap-5">
            <CrisisContacts variant="link" dark />
            <Link
              to="/caregiver"
              className="text-sm text-white/55 underline underline-offset-4 hover:text-white"
            >
              Caregiver
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center gap-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          {/* copy */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <span
              className="animate-fade-up rounded-full border border-white/12 bg-white/5 px-3.5 py-1 text-[10px] tracking-[0.22em] text-white/60 uppercase backdrop-blur"
              style={{ animationDelay: '0.08s' }}
            >
              A quiet minute, once a day
            </span>

            <h2
              className="animate-fade-up mt-4 font-display text-[1.9rem] leading-[1.12] text-white sm:text-4xl lg:text-5xl"
              style={{ animationDelay: '0.18s' }}
            >
              Unveiling how
              <br />
              you feel today.
            </h2>

            <p
              className="animate-fade-up mt-3 max-w-xs text-sm leading-relaxed text-white/50"
              style={{ animationDelay: '0.28s' }}
            >
              Three plates, one word each, one mood.
            </p>

            <p className="mt-6 hidden text-[11px] text-white/20 lg:block">
              Sahay AI is a reflective prototype, not a medical device.
            </p>
          </div>

          {/* sign-in */}
          <div className="w-full shrink-0" style={{ maxWidth: CARD_WIDTH }}>
            <div
              className="animate-fade-up rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-[0_30px_80px_-32px_rgba(0,0,0,0.95)] backdrop-blur-xl"
              style={{ animationDelay: '0.4s' }}
            >
              <div className="flex flex-col items-stretch gap-2">
                <GoogleSignInButton dark onSignedIn={onSignedIn} />
                <PhoneSignInButton dark />
              </div>

              <div className="my-4 flex items-center gap-3 text-[11px] tracking-wide text-white/25">
                <span className="h-px flex-1 bg-white/10" />
                or use email
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <PasswordAuthForm dark onSignedIn={onSignedIn} />
            </div>

            <div className="animate-fade-up mt-3" style={{ animationDelay: '0.5s' }}>
              <CrisisContacts dark />
            </div>
          </div>
        </main>

        <footer className="shrink-0 pb-1 text-center text-[11px] text-white/20 lg:hidden">
          Sahay AI is a reflective prototype, not a medical device.
        </footer>
      </div>
    </div>
  );
}
