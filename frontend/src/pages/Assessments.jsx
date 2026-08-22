import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import PageShell from '../components/PageShell.jsx';
import CrisisContacts from '../components/CrisisContacts.jsx';
import LoadError from '../components/LoadError.jsx';
import { useSession } from '../lib/useSession.js';
import { getAssessmentCatalog } from '../lib/api.js';
import { bandColor, bandTint } from '../lib/bands.js';

// Order the domains deliberately rather than however the catalog arrives:
// mood and distress first, the social block next, strengths after that, and
// the habit screens last — which is roughly the order of "how likely is this
// to be the reason you opened the app".
const DOMAIN_ORDER = [
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
        <div className="min-w-0">
          <p className="font-display text-xl leading-snug">{instrument.name}</p>
          <p className="mt-1.5 text-sm leading-snug text-[var(--color-ink-soft)]">
            {instrument.blurb}
          </p>
        </div>

        {/* A previous result is shown as its band colour, not as a bare
            number — 14 means nothing on its own, and "Moderate" in amber is
            legible at a glance. */}
        {last && (
          <span
            className="shrink-0 rounded-xl px-2.5 py-1.5 text-center"
            style={{ background: bandTint(last.band), color: bandColor(last.band) }}
          >
            <span className="num block text-lg leading-none">{last.score}</span>
            <span className="mt-1 block text-[9px] opacity-80">{formatWhen(last.createdAt)}</span>
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2 pt-4 text-xs text-[var(--color-muted)]">
        <span>{instrument.itemCount} questions</span>
        <span aria-hidden="true">·</span>
        <span>~{instrument.minutes} min</span>
        {last && (
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
          The real questionnaires
          <span className="text-[var(--sec-tests)]">.</span>
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--color-ink-soft)]">
          The same instruments used in clinics and research — PHQ-9, GAD-7 and nineteen more.
          Each gives a score and the range it falls in. A range is a description of a few weeks,
          not a diagnosis of you.
        </p>
      </div>

      {loading && instruments.length === 0 && (
        <p className="stack-block animate-pulse text-[var(--color-ink-soft)]">Loading…</p>
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
              Your answers and scores are stored and visible to your counsellor alongside your
              check-ins. If something here worries you, please talk to a person rather than a score.
            </p>
            <CrisisContacts variant="link" />
          </div>
        </>
      )}
    </PageShell>
  );
}
