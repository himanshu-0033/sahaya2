import { Link } from 'react-router-dom';
import GoogleSignInButton from './GoogleSignInButton.jsx';
import PhoneSignInButton from './PhoneSignInButton.jsx';
import PasswordAuthForm from './PasswordAuthForm.jsx';
import CrisisContacts from './CrisisContacts.jsx';
import Inkblot3D from './Inkblot3D.jsx';

export default function DarkSignInHero({ onSignedIn }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07080a]">
      {/* ambient wash */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% -5%, rgba(3,132,111,0.18), transparent 65%), radial-gradient(ellipse 50% 40% at 85% 20%, rgba(141,132,201,0.15), transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* the sculpture, turning behind everything */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: 'min(150vh, 165vw, 1100px)' }}
        aria-hidden="true"
      >
        <Inkblot3D spin className="w-full opacity-60" />
      </div>

      {/* scrim so the copy stays readable over the artwork */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 55% at 50% 55%, rgba(7,8,10,0.82), rgba(7,8,10,0.35) 60%, transparent)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-8 md:py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-white">Sahay AI</h1>
            <p className="mt-1 text-xs tracking-[0.2em] text-white/40 uppercase">Daily Check-in</p>
          </div>
          <div className="flex items-center gap-5">
            <CrisisContacts variant="link" dark />
            <Link to="/caregiver" className="text-sm text-white/60 underline underline-offset-4 hover:text-white">
              Caregiver
            </Link>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <span
            className="animate-fade-up inline-block rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs tracking-[0.2em] text-white/70 uppercase backdrop-blur"
            style={{ animationDelay: '0.1s' }}
          >
            A quiet minute, once a day
          </span>
          <h2
            className="animate-fade-up mt-5 font-display text-4xl leading-tight text-white md:text-6xl"
            style={{ animationDelay: '0.2s' }}
          >
            Unveiling how
            <br />
            you feel today.
          </h2>
          <p
            className="animate-fade-up mt-4 max-w-sm text-white/55"
            style={{ animationDelay: '0.3s' }}
          >
            Three plates, one word each, one mood — sign in to begin your check-in.
          </p>

          {/* floating glass card holding the sign-in options */}
          <div
            className="animate-fade-up mt-9 w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            style={{ animationDelay: '0.42s' }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="animate-soft-pulse rounded-full">
                <GoogleSignInButton dark onSignedIn={onSignedIn} />
              </div>
              <PhoneSignInButton dark />

              <div className="flex w-[320px] max-w-full items-center gap-3 py-1 text-xs text-white/30">
                <span className="h-px flex-1 bg-white/10" />
                or
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <PasswordAuthForm dark onSignedIn={onSignedIn} />
            </div>
          </div>

          <div className="animate-fade-up mt-8 w-full max-w-sm" style={{ animationDelay: '0.55s' }}>
            <CrisisContacts dark />
          </div>

          <p className="mt-8 text-xs text-white/25">
            Sahay AI is a reflective prototype, not a medical device.
          </p>
        </div>
      </div>
    </div>
  );
}
