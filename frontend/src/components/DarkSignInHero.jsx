import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import GoogleSignInButton from './GoogleSignInButton.jsx';
import PhoneSignInButton from './PhoneSignInButton.jsx';
import PasswordAuthForm from './PasswordAuthForm.jsx';
import CrisisContacts from './CrisisContacts.jsx';
import Inkblot3D from './Inkblot3D.jsx';
import Butterflies, { FeatureButterfly } from './Butterflies.jsx';

// three.js is most of the bundle and nothing above the fold needs it, so the
// WebGL sculpture loads on its own. The SVG version stands in meanwhile —
// same paths, so the swap is a change of material, not of shape.
const GlassSculpture = lazy(() => import('./GlassSculpture.jsx'));

// The glass version is off.
//
// It compiles to 594 kB — 154 kB gzipped — which is the largest chunk in the
// app by a wide margin, larger than everything else put together. Lazy-loading
// it was correct and did not help: it renders on the sign-in screen, which is
// the first screen, so it downloads immediately anyway. That is 154 kB of
// three.js on hostel wifi before a person in a bad week has seen the app do a
// single useful thing.
//
// Inkblot3D draws the same paths from the same source, flat. It is the same
// object in a different material, and it costs nothing.
//
// This is one boolean, not a deletion: GlassSculpture.jsx is untouched, and if
// the weight ever stops mattering — a desktop build, a faster budget — flip it
// back. The lazy() above stays so the chunk keeps building; it is simply never
// requested while this is false.
const USE_WEBGL_SCULPTURE = false;

const SCULPTURE_BOX = 'h-[38vh] w-full min-h-[240px] sm:h-[46vh] lg:h-[76vh] lg:min-h-[420px]';

// The sculpture leads and the copy sits beside it, so the first thing on
// screen is the object rather than a form. Sign-in stays one tap away
// behind the call to action instead of competing with it.
export default function DarkSignInHero({ onSignedIn }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Moving focus into the panel keeps the keyboard path intact — the button
  // that opened it is about to be replaced by the form.
  useEffect(() => {
    if (!open) return;
    const target = panelRef.current?.querySelector('input, button');
    target?.focus({ preventScroll: true });
  }, [open]);

  // Only the horizontal overflow is clipped: the sculpture drifts sideways
  // with the cursor, but the column still has to scroll once the sign-in
  // panel is open on a short viewport.
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#05060a]">
      {/* Ground tone: a cold pool under the piece and a faint warm rise on
          the right, so the frame isn't a flat black rectangle. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 50% at 26% 45%, rgba(18,74,72,0.30), transparent 68%), radial-gradient(ellipse 45% 45% at 88% 78%, rgba(120,52,30,0.18), transparent 72%)',
        }}
        aria-hidden="true"
      />

      {/* The ambient field sits on the ground tone, under everything else.
          The feature butterfly is one layer up so it can pass in front of
          the sculpture — but both are still beneath the content column,
          which carries its own z-index, so nothing ever drifts across the
          sign-in form or makes the copy harder to read. */}
      <Butterflies />
      <FeatureButterfly className="z-[1]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 lg:px-10">
        <header className="flex shrink-0 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-[7px] border border-[var(--line-4)]"
              aria-hidden="true"
            >
              <span className="h-2.5 w-2.5 rotate-45 border border-[var(--line-7)]" />
            </span>
            <span className="font-eyebrow text-[11px] font-semibold text-white/90">
              Sahay <span className="font-normal text-white/45">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-5">
            <CrisisContacts variant="link" dark />
            <Link
              to="/caregiver"
              className="text-sm text-white/50 underline underline-offset-4 transition-colors hover:text-white"
            >
              Caregiver
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center gap-6 py-6 lg:flex-row lg:gap-10 lg:py-0">
          {/* The object. It takes the larger half of the split and reaches
              past the container on wide screens so it reads as a specimen
              being looked at, not an illustration boxed into a column. */}
          <div className="relative flex w-full shrink-0 items-center justify-center lg:w-[54%]">
            {USE_WEBGL_SCULPTURE ? (
              <Suspense
                fallback={
                  <div className={`${SCULPTURE_BOX} flex items-center justify-center`}>
                    <Inkblot3D spin interactive className="h-full opacity-70" />
                  </div>
                }
              >
                <GlassSculpture className={SCULPTURE_BOX} />
              </Suspense>
            ) : (
              <div className={`${SCULPTURE_BOX} flex items-center justify-center`}>
                <Inkblot3D spin interactive className="h-full" />
              </div>
            )}

            {/* Fades the reflection into the floor. Sits over the canvas but
                must not swallow the drag, hence pointer-events-none. */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%]"
              style={{
                background:
                  'linear-gradient(to top, #05060a 18%, rgba(5,6,10,0.75) 52%, transparent)',
              }}
              aria-hidden="true"
            />
          </div>

          {/* The copy. */}
          <div className="flex w-full flex-col items-center text-center lg:items-start lg:text-left">
            <span
              className="animate-fade-up font-eyebrow rounded-full border border-[var(--line-2)] bg-[var(--surface-2)] px-3.5 py-1 text-[11px] text-white/55 backdrop-blur"
              style={{ animationDelay: '0.08s' }}
            >
              A quiet minute, once a day
            </span>

            <h1
              className="animate-fade-up font-hero mt-5 text-[2.1rem] text-white sm:text-5xl lg:text-[3.9rem]"
              style={{ animationDelay: '0.18s' }}
            >
              Unveiling
              <br />
              the self
            </h1>

            <p
              className="animate-fade-up mt-4 max-w-sm text-[15px] leading-relaxed text-white/45"
              style={{ animationDelay: '0.28s' }}
            >
              Three plates, one word each, one mood. A guided check-in that takes
              a minute and asks nothing more of you.
            </p>

            {/* Call to action, and the form it opens onto. */}
            <div className="mt-8 w-full max-w-[370px]">
              {!open ? (
                <div className="animate-fade-up" style={{ animationDelay: '0.38s' }}>
                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="font-eyebrow w-full rounded-full border border-[var(--line-5)] bg-[var(--surface-1)] px-8 py-3.5 text-[11px] font-semibold text-white/90 backdrop-blur transition-all hover:border-[var(--line-7)] hover:bg-[var(--surface-4)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  >
                    Begin check-in
                  </button>

                  <p className="mt-4 text-[13px] text-white/35">
                    <button
                      type="button"
                      onClick={() => setOpen(true)}
                      className="underline underline-offset-4 transition-colors hover:text-white/75"
                    >
                      Sign in
                    </button>
                    <span className="mx-2.5 text-white/15">·</span>
                    <Link
                      to="/caregiver"
                      className="underline underline-offset-4 transition-colors hover:text-white/75"
                    >
                      Learn more
                    </Link>
                  </p>
                </div>
              ) : (
                <div
                  ref={panelRef}
                  className="animate-fade-up rounded-3xl border border-[var(--line-2)] bg-[var(--surface-2)] p-5 text-left shadow-[0_30px_80px_-32px_rgba(0,0,0,0.95)] backdrop-blur-xl"
                >
                  <div className="flex flex-col items-stretch gap-2">
                    <GoogleSignInButton dark onSignedIn={onSignedIn} />
                    <PhoneSignInButton dark onSignedIn={onSignedIn} />
                  </div>

                  <div className="my-4 flex items-center gap-3 text-[11px] tracking-wide text-white/25">
                    <span className="h-px flex-1 bg-[var(--surface-4)]" />
                    or use email
                    <span className="h-px flex-1 bg-[var(--surface-4)]" />
                  </div>

                  <PasswordAuthForm dark onSignedIn={onSignedIn} />

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="mt-4 w-full text-center text-[12px] text-white/30 transition-colors hover:text-white/60"
                  >
                    Back
                  </button>
                </div>
              )}

              <div className="animate-fade-up mt-3" style={{ animationDelay: '0.48s' }}>
                <CrisisContacts dark />
              </div>
            </div>
          </div>
        </main>

        <footer className="shrink-0 pt-4 text-center text-[11px] text-white/20 lg:text-left">
          Sahay AI is a reflective prototype, not a medical device.
        </footer>
      </div>
    </div>
  );
}
