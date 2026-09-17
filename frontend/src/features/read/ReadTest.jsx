import { Link, useParams } from 'react-router-dom';
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

// The answer scale, as the chips a person will actually tap, with the number
// each one is worth. The score is the sum of those numbers and nothing else,
// which is worth being able to see rather than take on trust.
function Options({ options }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {options.map((o) => (
        <li
          key={o.value}
          className="rounded-[2px] border border-[var(--line-2)] px-2.5 py-1 text-xs text-[var(--color-ink-soft)]"
        >
          <span className="num text-[var(--color-muted)]">{o.value}</span>
          <span className="ml-1.5">{o.label}</span>
        </li>
      ))}
    </ul>
  );
}

// Every question, in order, exactly as the app asks them.
//
// This is the section the page was missing. An explainer that describes a
// questionnaire in five paragraphs and never shows it asks someone to decide
// whether to answer nine questions about themselves without seeing the nine
// questions, which is the one thing they most obviously need.
//
// Items are omitted only where the licence to reproduce them has not come
// back, which is the same reason the app does not administer those.
function Questions({ meta }) {
  if (!meta.items) return null;
  return (
    <section className="mt-10">
      <h2 className="font-display text-[1.3rem] leading-snug">The questions</h2>
      {meta.prompt && (
        <p className="mt-3 text-[1.02rem] leading-[1.75] text-[var(--color-ink-soft)]">
          {meta.prompt}
        </p>
      )}
      {meta.options && <Options options={meta.options} />}

      <ol className="mt-5 grid gap-3.5">
        {meta.items.map((item, i) => {
          const crisis = meta.crisisItems?.includes(i);
          return (
            <li key={item.text} className="flex gap-3">
              <span className="num mt-0.5 w-5 shrink-0 text-sm text-[var(--color-muted)]">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-[1.02rem] leading-[1.6]">{item.text}</span>
                {(item.reverse || Number.isInteger(item.dependsOn) || crisis) && (
                  <span className="mt-1.5 block text-xs leading-relaxed text-[var(--color-muted)]">
                    {item.reverse && 'Scored in reverse: agreeing with it lowers the total. '}
                    {Number.isInteger(item.dependsOn) &&
                      `Asked only if question ${item.dependsOn + 1} was answered yes. `}
                    {crisis &&
                      'Answering anything but the lowest option puts crisis contacts on your screen and flags the result for your counsellor, whatever the total comes to.'}
                  </span>
                )}
                {item.options && <Options options={item.options} />}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// The band table, built from the same `bands` the scorer uses, so a page that
// explains the thresholds cannot disagree with the code that applies them.
//
// Bands carry an upper bound and no lower one, because the scorer walks them in
// order and takes the first one a score fits. Rendering them needs the gaps
// filled in, which is what `from` does here.
function Bands({ meta }) {
  if (!meta.bands || meta.bands.every((b) => b.max == null)) return null;
  return (
    <section className="mt-10">
      <h2 className="font-display text-[1.3rem] leading-snug">What each score is called</h2>
      <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
        {meta.higherIsBetter
          ? 'A higher score is a better result on this one.'
          : 'A higher score means more of what the questionnaire asks about.'}{' '}
        These are the names its authors gave the ranges. They are labels for a range, not
        diagnoses.
      </p>
      <ul className="mt-4 grid gap-2.5">
        {meta.bands.map((band, i) => {
          const prev = i > 0 ? meta.bands[i - 1].max : null;
          const from = prev == null ? null : prev + 1;
          const range =
            i === 0
              ? `${band.max} or less`
              : i === meta.bands.length - 1
                ? `${from} or more`
                : `${from} to ${band.max}`;
          return (
            <li
              key={band.label}
              className="rounded-2xl border border-[var(--line-1)] bg-[var(--surface-1)] px-4 py-3"
            >
              <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="num text-sm text-[var(--color-ink)]">{range}</span>
                <span className="text-sm font-semibold">{band.label}</span>
              </p>
              {band.note && (
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">{band.note}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// Public, like the rest of the reading section. See the note in Read.jsx.
export default function ReadTest() {
  const { instrumentId } = useParams();
  const session = useSession();

  const note = getTestNote(instrumentId);
  const meta = TEST_INDEX.find((t) => t.id === instrumentId);
  // The rest of the same domain, so a page about the PHQ-9 is one tap from the
  // other mood questionnaires rather than a dead end back to the index.
  const related = TEST_INDEX.filter((t) => t.domain === meta?.domain && t.id !== instrumentId);

  if (!note || !meta) {
    return (
      <PageShell section="read" width="narrow" tabs={Boolean(session)}>
        <Header eyebrow="Read" standalone={!session} />
        <div className="stack-block">
          <h1 className="font-display text-2xl">No notes on that questionnaire.</h1>
          <Link to="/read" className="press mt-5 inline-block text-sm text-[var(--sec-read-deep)]">
            Back to reading
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell section="read" width="narrow" tabs={Boolean(session)}>
      <Header eyebrow="Read" standalone={!session} />

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
              className="rounded-[2px] px-2.5 py-1 text-[0.6875rem]"
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
            {/* The licence belongs on the page for the same reason the item
                wording warning does: it is the reason some questionnaires can
                be offered here and others only described. */}
            {meta.license && (
              <div className="sm:col-span-2">
                <p className="marginalia">Licence</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {meta.license}
                </p>
              </div>
            )}
          </div>
        </div>

        <Field label="What it measures">{note.measures}</Field>
        <Questions meta={meta} />
        <Bands meta={meta} />
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

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-[1.3rem] leading-snug">
              The others in {meta.domain.toLowerCase()}
            </h2>
            <ul className="mt-4 grid gap-2">
              {related.map((t) => (
                <li key={t.id}>
                  <Link
                    to={`/read/tests/${t.id}`}
                    className="press flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 rounded-2xl border border-[var(--line-1)] px-4 py-3 transition-colors hover:border-[var(--line-4)]"
                  >
                    <span className="text-sm font-semibold">{t.name}</span>
                    <span className="text-xs text-[var(--color-muted)]">{t.blurb}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
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
            <p className="marginalia" style={{ color: 'var(--color-amber-deep)' }}>
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
              className="press rounded-[2px] px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: HUE }}
            >
              Take the {meta.name}
            </Link>
          )}
          <Link
            to="/read"
            className="press rounded-[2px] border border-[var(--line-2)] px-5 py-2.5 text-sm text-[var(--color-ink-soft)] transition-colors hover:border-[var(--line-4)]"
          >
            Read something else
          </Link>
          <CrisisContacts variant="link" />
        </div>
      </article>
    </PageShell>
  );
}
