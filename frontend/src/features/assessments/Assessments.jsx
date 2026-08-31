import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../layouts/Header.jsx';
import PageShell from '../../layouts/PageShell.jsx';
import CrisisContacts from '../../shared/CrisisContacts.jsx';
import LoadError from '../../shared/LoadError.jsx';
import { SkeletonCards } from '../../shared/Skeleton.jsx';
import { useSession } from '../auth/useSession.js';
import { getAssessmentCatalog } from '../../shared/api.js';
import { bandColor, bandTint } from './bands.js';
import { SET_IDS, labelFor, setStartHref } from './testSet.js';

// Order the domains deliberately rather than however the catalog arrives:
// safety first, then mood and distress, the social block next, strengths after
// that, and the habit screens last — which is roughly the order of "how likely
// is this to be the reason you opened the app", with the one exception that
// Safety leads regardless of likelihood.
const DOMAIN_ORDER = [
  'Safety',
  'Mood',
  'Anxiety',
  'General distress',
  'Stress',
  'Trauma',
  'Burnout',
  'Social',
  'Wellbeing',
  'Strengths',
  'Self',
  'Sleep',
  'Body',
  'Eating',
  'Habits',
];

function domainRank(domain) {
  const i = DOMAIN_ORDER.indexOf(domain);
  return i === -1 ? DOMAIN_ORDER.length : i;
}

function formatWhen(iso) {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function InstrumentCard({ instrument, last, index }) {
  return (
    <Link
      to={`/assessments/${instrument.id}`}
      style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
      className="animate-slide-up card press flex flex-col p-5"
    >
      <div className="flex items-start justify-between gap-4">
        {/* The acronym used to be the headline and the plain English the
            footnote, so a shelf of these read as PHQ-9 / GAD-7 / UCLA-3 —
            a wall of codes to somebody who came here upset.

            Swapped, not renamed. Calling the PHQ-9 a "Depression Screener"
            would lose the thing that makes this app's questionnaires worth
            trusting: they are the published instruments, with the citation
            and the licence attached, and the reading section documents each
            one by name. So the sentence leads and the name stays underneath
            it, where it identifies rather than gatekeeps. */}
        <div className="min-w-0">
          <p className="font-display text-xl leading-snug">{instrument.blurb}</p>
          <p className="marginalia mt-2">{instrument.name}</p>
        </div>

        {/* A previous result is shown as its band colour, not as a bare
            number — 14 means nothing on its own, and "Moderate" in amber is
            legible at a glance. */}
        {last && (
          <span
            className="shrink-0 rounded-xl px-2.5 py-1.5 text-center"
            style={{ background: bandTint(last.band), color: bandColor(last.band) }}
          >
            {last.reportsBandOnly ? (
              <span className="block text-xs leading-tight">{last.band.label}</span>
            ) : (
              <span className="num block text-lg leading-none">{last.score}</span>
            )}
            <span className="mt-1 block text-[9px] opacity-80">{formatWhen(last.createdAt)}</span>
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2 pt-4 text-xs text-[var(--color-muted)]">
        <span>{instrument.itemCount} questions</span>
        <span aria-hidden="true">·</span>
        <span>~{instrument.minutes} min</span>
        {last && !last.reportsBandOnly && (
          <>
            <span aria-hidden="true">·</span>
            <span>last: {last.band.label}</span>
          </>
        )}
      </div>
    </Link>
  );
}

export default function Assessments() {
  const navigate = useNavigate();
  const session = useSession();
  const [instruments, setInstruments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!session) {
      navigate('/');
      return;
    }
    setLoading(true);
    setError(null);
    getAssessmentCatalog()
      .then((data) => {
        setInstruments(data.instruments || []);
        setSessions(data.sessions || []);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [session, navigate, reloadKey]);

  const lastByInstrument = useMemo(() => {
    const map = new Map();
    for (const s of sessions) if (!map.has(s.instrumentId)) map.set(s.instrumentId, s);
    return map;
  }, [sessions]);

  const domains = useMemo(() => {
    const set = [...new Set(instruments.map((i) => i.domain))];
    return set.sort((a, b) => domainRank(a) - domainRank(b));
  }, [instruments]);

  const grouped = useMemo(() => {
    const shown = filter ? instruments.filter((i) => i.domain === filter) : instruments;
    const byDomain = new Map();
    for (const i of shown) {
      if (!byDomain.has(i.domain)) byDomain.set(i.domain, []);
      byDomain.get(i.domain).push(i);
    }
    return [...byDomain.entries()].sort((a, b) => domainRank(a[0]) - domainRank(b[0]));
  }, [instruments, filter]);

  if (!session) return null;

  return (
    <PageShell section="tests">
      <Header eyebrow="Tests" />

      <div className="animate-slide-up stack-block">
        <h1 className="font-display text-[1.95rem] leading-[1.12] sm:text-[2.6rem]">
          Questionnaires
          <span className="text-[var(--sec-tests)]">.</span>
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--color-ink-soft)]">
          The same ones a clinic uses. A score is not a diagnosis.
        </p>

        {/* Two links rather than three paragraphs of caveat here. Someone who
            has come to take a questionnaire should not have to read an essay
            first — but the two questions they will have afterwards are which
            one to pick and how much to believe the number, so both are one
            tap away. */}
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
          <Link
            to="/read/which-test-and-what-for"
            className="press inline-flex items-center gap-1.5 text-xs text-[var(--sec-tests)]"
          >
            Which test, and what for
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link
            to="/read/a-positive-screen-is-not-a-diagnosis"
            className="press inline-flex items-center gap-1.5 text-xs text-[var(--sec-tests)]"
          >
            A positive screen is not a diagnosis
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link
            to="/read/where-your-answers-go"
            className="press inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)]"
          >
            Where your answers go
          </Link>
        </div>
      </div>

      {/* The set, above the shelf of twenty-one.

          A catalogue answers "which one do you want", and most people opening
          this page cannot answer that — they want to know where they are, and
          that takes three instruments, not one. So the common case gets a
          button and the library stays underneath it for everyone who does
          know what they came for. */}
      <Link
        to={setStartHref(SET_IDS)}
        className="animate-slide-up card press stack-block flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
        style={{ animationDelay: '40ms' }}
      >
        <span className="block min-w-0">
          <span className="marginalia">Start here</span>
          <span className="font-display mt-2.5 block text-xl leading-snug sm:text-2xl">
            All three, in one sitting
          </span>
          <span className="mt-2 block text-sm leading-relaxed text-[var(--color-ink-soft)]">
            {SET_IDS.map(labelFor).join(', ')} — low mood, worry and wellbeing. About six
            minutes, one set of results.
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-[var(--sec-tests)] px-5 py-2.5 text-sm font-medium text-[#07080a] sm:self-auto">
          Take all three
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </Link>

      {loading && instruments.length === 0 && (
        <SkeletonCards label="Loading the questionnaires…" count={6} />
      )}
      {error && instruments.length === 0 && (
        <LoadError error={error} retrying={loading} onRetry={() => setReloadKey((k) => k + 1)} />
      )}

      {!loading && instruments.length > 0 && (
        <>
          {/* Horizontal scrolling filter — 14 domains will never fit as a
              wrapped row on a phone without eating half the screen. */}
          <div className="animate-slide-up stack-block -mx-5 overflow-x-auto px-5 pb-1" style={{ animationDelay: '60ms' }}>
            <div className="flex w-max items-center gap-2">
              <button
                type="button"
                onClick={() => setFilter(null)}
                aria-pressed={filter === null}
                className="press shrink-0 rounded-full border px-4 py-2 text-xs transition-colors"
                style={{
                  borderColor: filter === null ? 'var(--sec-tests)' : 'rgba(255,255,255,0.1)',
                  background: filter === null ? 'rgba(88,182,245,0.14)' : 'transparent',
                  color: filter === null ? 'var(--sec-tests)' : 'var(--color-ink-soft)',
                }}
              >
                All {instruments.length}
              </button>
              {domains.map((domain) => {
                const active = filter === domain;
                return (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => setFilter(active ? null : domain)}
                    aria-pressed={active}
                    className="press shrink-0 rounded-full border px-4 py-2 text-xs transition-colors"
                    style={{
                      borderColor: active ? 'var(--sec-tests)' : 'rgba(255,255,255,0.1)',
                      background: active ? 'rgba(88,182,245,0.14)' : 'transparent',
                      color: active ? 'var(--sec-tests)' : 'var(--color-ink-soft)',
                    }}
                  >
                    {domain}
                  </button>
                );
              })}
            </div>
          </div>

          {grouped.map(([domain, list]) => (
            <section key={domain} className="stack-group">
              <div className="flex items-baseline gap-3">
                <h2 className="font-display text-lg">{domain}</h2>
                <span className="rule-fade flex-1" />
                <span className="marginalia">{list.length}</span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {list.map((instrument, i) => (
                  <InstrumentCard
                    key={instrument.id}
                    instrument={instrument}
                    index={i}
                    last={lastByInstrument.get(instrument.id)}
                  />
                ))}
              </div>
            </section>
          ))}

          <div className="rule-fade stack-section" />

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pb-2">
            <p className="max-w-md text-[11px] leading-relaxed text-[var(--color-muted)]">
              Your answers and scores are saved to your account. Nobody else can see them unless
              you invite a counsellor to follow along, and you can stop sharing whenever you like.
              If something here worries you, please talk to a person rather than a score.
            </p>
            <CrisisContacts variant="link" />
          </div>
        </>
      )}
    </PageShell>
  );
}
