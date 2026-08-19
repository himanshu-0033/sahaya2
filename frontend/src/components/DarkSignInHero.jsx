import { Link } from 'react-router-dom';
import GoogleSignInButton from './GoogleSignInButton.jsx';
import PhoneSignInButton from './PhoneSignInButton.jsx';
import PasswordAuthForm from './PasswordAuthForm.jsx';
import CrisisContacts from './CrisisContacts.jsx';
import Inkblot3D from './Inkblot3D.jsx';

const CARD_PADDING = 24;
const CARD_WIDTH = 320 + CARD_PADDING * 2;

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

      {/* the sculpture, turning quietly behind the content */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: 'min(135vh, 150vw, 980px)' }}
        aria-hidden="true"
      >
        <Inkblot3D spin className="w-full opacity-40" />
      </div>

      {/* scrim keeps the copy crisp over the artwork */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 60% at 50% 52%, rgba(7,8,10,0.9), rgba(7,8,10,0.55) 55%, rgba(7,8,10,0.25))',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-7">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl text-white">Sahay AI</h1>
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

        <main className="flex flex-1 flex-col items-center justify-center py-8">
          <span
            className="animate-fade-up rounded-full border border-white/12 bg-white/5 px-3.5 py-1 text-[10px] tracking-[0.22em] text-white/60 uppercase backdrop-blur"
            style={{ animationDelay: '0.08s' }}
          >
            A quiet minute, once a day
          </span>

          <h2
            className="animate-fade-up mt-5 text-center font-display text-[2.1rem] leading-[1.12] text-white sm:text-5xl"
            style={{ animationDelay: '0.18s' }}
          >
            Unveiling how
            <br />
            you feel today.
          </h2>

          <p
            className="animate-fade-up mt-3.5 max-w-xs text-center text-sm leading-relaxed text-white/50"
            style={{ animationDelay: '0.28s' }}
          >
            Three plates, one word each, one mood.
          </p>

          <div
            className="animate-fade-up mt-8 rounded-3xl border border-white/10 bg-white/[0.055] shadow-[0_30px_80px_-32px_rgba(0,0,0,0.95)] backdrop-blur-xl"
            style={{
              animationDelay: '0.4s',
              width: '100%',
              maxWidth: CARD_WIDTH,
              padding: CARD_PADDING,
            }}
          >
            <div className="flex flex-col items-stretch gap-2.5">
              <GoogleSignInButton dark onSignedIn={onSignedIn} />
              <PhoneSignInButton dark />
            </div>

            <div className="my-5 flex items-center gap-3 text-[11px] tracking-wide text-white/25">
              <span className="h-px flex-1 bg-white/10" />
              or use email
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <PasswordAuthForm dark onSignedIn={onSignedIn} />
          </div>

          <div
            className="animate-fade-up mt-5 w-full"
            style={{ animationDelay: '0.5s', maxWidth: CARD_WIDTH }}
          >
            <CrisisContacts dark />
          </div>
        </main>

        <footer className="pb-1 text-center text-[11px] text-white/20">
          Sahay AI is a reflective prototype, not a medical device.
        </footer>
      </div>
    </div>
  );
}
