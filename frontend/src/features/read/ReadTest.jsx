import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '../../layouts/Header.jsx';
import PageShell from '../../layouts/PageShell.jsx';
import CrisisContacts from '../../shared/CrisisContacts.jsx';
import { useSession } from '../auth/useSession.js';
import { getTestNote } from './testNotes.js';
import { TEST_INDEX } from './testIndex.js';

// The dossier for one questionnaire.
//
// Fixed sections in a fixed order, every time. That is deliberate: someone
// comparing two questionnaires should find the limitations in the same place
// on both pages rather than having to hunt for whether this particular write-up
// happened to mention them.
//
// "What it is bad at" is not collapsible and is not last on the page by
// accident — it sits directly under how to read the score, because that is the
// point at which someone has just been handed a number and is deciding how
// much to believe it.

const HUE = 'var(--sec-tests)';

function Field({ label, children }) {
  if (!children) return null;
  return (
    <section className="mt-8">
      <h2 className="font-display text-[1.3rem] leading-snug">{label}</h2>
      <p className="mt-3 text-[1.02rem] leading-[1.75] text-[var(--color-ink-soft)]">{children}</p>
    </section>
  );
}

export default function ReadTest() {
  const { instrumentId } = useParams();
  const navigate = useNavigate();
  const session = useSession();

  if (!session) {
    navigate('/');
    return null;
  }

  const note = getTestNote(instrumentId);
  const meta = TEST_INDEX.find((t) => t.id === instrumentId);

  if (!note || !meta) {
    return (
      <PageShell section="read" width="narrow">
        <Header eyebrow="Read" />
        <div className="stack-block">
          <h1 className="font-display text-2xl">No notes on that questionnaire.</h1>
          <Link to="/read" className="press mt-5 inline-block text-sm text-[var(--sec-read)]">
            Back to reading
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell section="read" width="narrow">
      <Header eyebrow="Read" />

      <article className="animate-slide-up">
        <Link
          to="/read"
          className="press inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          All reading
        </Link>

        <header className="mt-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="rounded-full px-2.5 py-1 text-[0.6875rem]"
              style={{ background: `color-mix(in srgb, ${HUE} 15%, transparent)`, color: HUE }}
            >
              {meta.domain}
            </span>
            <span className="text-xs text-[var(--color-muted)]">
              <span className="num">{meta.itemCount}</span> questions
            </span>
          </div>

          <h1 className="font-display mt-4 text-[2rem] leading-[1.1] sm:text-[2.5rem]">
            {meta.name}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">{meta.fullName}</p>
        </header>

        {/* The two numbers people actually came for, before the prose. */}
        <div className="card mt-7 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="marginalia">Score range</p>
              <p className="num mt-1.5 text-lg">{note.range}</p>
            </div>
            <div>
              <p className="marginalia">Thresholds</p>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {note.cutoffs}
              </p>
            </div>
          </div>
        </div>

        <Field label="What it measures">{note.measures}</Field>
        <Field label="Where it came from">{note.origin}</Field>
        <Field label="How to read your score">{note.reading}</Field>
        <Field label="What it cannot tell you">{note.limits}</Field>

        {note.watch && (
          <div className="mt-8 border-l-2 pl-5" style={{ borderColor: HUE }}>
            <p className="marginalia">Worth knowing</p>
            <p className="mt-2 text-[1.02rem] leading-[1.7] text-[var(--color-ink-soft)]">
              {note.watch}
            </p>
          </div>
        )}

        {/* The app is honest elsewhere about which item wordings were checked
            against the source paper and which were written from memory. It
            would be strange to be careful about that on the questionnaire
            itself and quiet about it on the page explaining the questionnaire. */}
        {meta.wordingVerified === false && (
          <p className="mt-8 rounded-2xl border border-[var(--line-2)] bg-[var(--surface-1)] p-5 text-xs leading-relaxed text-[var(--color-muted)]">
            The item wording used in this app has not been checked line by line against the
            original publication. The scale, scoring and thresholds are right; a phrase or two may
            differ from the published version, which is fine for reflection and not good enough for
            research.
          </p>
        )}

        <section className="mt-12 border-t border-[var(--line-1)] pt-6">
          <p className="marginalia">Where this comes from</p>
          <ul className="mt-4 grid gap-4">
            {note.sources.map((source) => (
              <li key={source.label} className="text-xs leading-relaxed text-[var(--color-muted)]">
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline decoration-white/20 underline-offset-2 transition-colors hover:text-[var(--color-ink-soft)]"
                  >
                    {source.label}
                  </a>
                ) : (
                  source.label
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* An instrument can be documented here and still not be one the app
            serves. Explaining the Columbia protocol is worth doing; offering a
            button that 404s is not. See licenceCleared in instruments.js. */}
        {meta.available === false && (
          <div className="mt-10 rounded-2xl border border-[var(--color-amber)]/30 bg-[rgba(217,165,92,0.06)] p-5">
            <p className="marginalia" style={{ color: 'var(--color-amber)' }}>
              Not available here
            </p>
            <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              The {meta.name} is copyrighted, and using it requires written permission from the
              people who publish it. Until that permission is in place, DP Sahay AI documents it but does
              not administer it. Everything on this page still describes it accurately.
            </p>
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-3 pb-2">
          {meta.available !== false && (
            <Link
              to={`/assessments/${meta.id}`}
              className="press rounded-full px-5 py-2.5 text-sm text-[#07080a]"
              style={{ background: HUE }}
            >
              Take the {meta.name}
            </Link>
          )}
          <Link
            to="/read"
            className="press rounded-full border border-[var(--line-2)] px-5 py-2.5 text-sm text-[var(--color-ink-soft)] transition-colors hover:border-[var(--line-4)]"
          >
            Read something else
          </Link>
          <CrisisContacts variant="link" />
        </div>
      </article>
    </PageShell>
  );
}
