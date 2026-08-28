import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../layouts/Header.jsx';
import PageShell from '../../layouts/PageShell.jsx';
import CrisisContacts from '../../shared/CrisisContacts.jsx';
import LoadError from '../../shared/LoadError.jsx';
import { SkeletonCards } from '../../shared/Skeleton.jsx';
import { useSession } from '../auth/useSession.js';
import { getGroundingCatalog } from '../../shared/api.js';
import { accent, alpha, EVIDENCE_LABEL, SPEED_LABEL, formatDuration } from '../../shared/accents.js';

// The grounding index.
//
// The organising idea is that someone arriving here is already having a bad
// time and should not have to read a menu of thirteen things. So the first
// thing on the page is "how are you right now" — one tap narrows thirteen to
// three. The full library is still underneath for anyone browsing calmly.

function MoodPicker({ moods, active, onPick }) {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {moods.map((mood) => {
        const selected = active === mood.id;
        return (
          <button
            key={mood.id}
            type="button"
            onClick={() => onPick(selected ? null : mood.id)}
            aria-pressed={selected}
            className={`press rounded-full border px-4 py-2 text-sm transition-colors duration-200 ${
              selected
                ? 'border-[var(--sec-calm)] bg-[var(--sec-calm)]/12 text-[var(--color-ink)]'
                : 'border-[var(--line-2)] text-[var(--color-ink-soft)] hover:border-[var(--line-4)]'
            }`}
          >
            {mood.label}
          </button>
        );
      })}
    </div>
  );
}

// One uniform surface. The practice's accent survives in exactly two small
// places — the duration pill and the "done" stamp — which is enough to tell
// a breath exercise from a kindness one without giving every card its own
// coloured background.
function TechniqueCard({ technique, last, index }) {
  const { base, bright } = accent(technique.accent);

  return (
    <Link
      to={`/grounding/${technique.id}`}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      className="animate-slide-up card press flex flex-col p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-xl leading-snug">{technique.name}</p>
          {technique.aka && (
            <p className="mt-1 text-xs text-[var(--color-muted)]">{technique.aka}</p>
          )}
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] whitespace-nowrap"
          style={{ background: alpha(base, 0.14), color: bright }}
        >
          {formatDuration(technique.seconds)}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
        {technique.tagline}
      </p>

      {/* Pushed to the bottom so every card in a row shares one baseline,
          however long its tagline runs. */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs text-[var(--color-muted)]">
        <span>{SPEED_LABEL[technique.speed]}</span>
        {last && <span style={{ color: bright }}>done {last}</span>}
      </div>
    </Link>
  );
}

function formatWhen(iso) {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function Grounding() {
  const navigate = useNavigate();
  const session = useSession();

  const [data, setData] = useState(null);
  const [mood, setMood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Bumped by the retry button; the effect keys off it so a retry is just a
  // re-run of the same load path rather than a second, divergent one.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!session) {
      navigate('/');
      return;
    }
    setLoading(true);
    setError(null);
    getGroundingCatalog()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [session, navigate, reloadKey]);

  const lastByTechnique = useMemo(() => {
    const map = new Map();
    for (const s of data?.sessions || []) {
      if (!map.has(s.techniqueId)) map.set(s.techniqueId, formatWhen(s.createdAt));
    }
    return map;
  }, [data]);

  const suggested = useMemo(() => {
    if (!data || !mood) return null;
    const picked = data.moods.find((m) => m.id === mood);
    if (!picked) return null;
    return picked.techniques
      .map((id) => data.techniques.find((t) => t.id === id))
      .filter(Boolean);
  }, [data, mood]);

  const grouped = useMemo(() => {
    if (!data) return [];
    return data.families
      .map((family) => [family, data.techniques.filter((t) => t.family === family.id)])
      .filter(([, list]) => list.length > 0);
  }, [data]);

  if (!session) return null;

  return (
    <PageShell section="calm" width="wide">
      <Header eyebrow="Calm" />

      <div className="animate-slide-up stack-block">
        <h1 className="font-display text-[1.95rem] leading-[1.12] sm:text-[2.6rem]">
          Thirteen things for when
          <br className="hidden sm:block" /> your head is loud
          <span className="text-[var(--sec-calm)]">.</span>
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--color-ink-soft)]">
          Short practices you run right here — the app counts, paces and prompts. Each says what
          it is for, how strong the evidence actually is, and links a guided video if you would
          rather be talked through it.
        </p>
      </div>

      {loading && !data && (
        <SkeletonCards label="Loading the practices…" count={6} />
      )}
      {error && !data && (
        <LoadError error={error} retrying={loading} onRetry={() => setReloadKey((k) => k + 1)} />
      )}

      {data && (
        <>
          {data.streak > 0 && (
            <p className="mt-6 inline-block rounded-full border border-[var(--line-2)] px-4 py-2 text-xs text-[var(--color-ink-soft)]">
              <span className="num">{data.streak}</span> day{data.streak === 1 ? '' : 's'} in a row. Nice.
            </p>
          )}

          <section className="stack-section">
            <p className="marginalia">
              How are you right now?
            </p>
            <MoodPicker moods={data.moods} active={mood} onPick={setMood} />
          </section>

          {suggested && (
            <section className="stack-block">
              <p className="text-sm text-[var(--color-ink-soft)]">
                Start with the first one — they are in the order most people find useful.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {suggested.map((technique, i) => (
                  <TechniqueCard
                    key={technique.id}
                    technique={technique}
                    index={i}
                    last={lastByTechnique.get(technique.id)}
                  />
                ))}
              </div>
              <p className="mt-4 text-xs text-[var(--color-muted)]">
                These are fixed suggestions for “{data.moods.find((m) => m.id === mood)?.label}”,
                the same for everyone. Nothing here reads your check-ins or your scores.
              </p>
            </section>
          )}

          <div className="stack-section">
            <p className="marginalia">
              {suggested ? 'Everything else' : 'The whole library'}
            </p>

            {grouped.map(([family, list]) => (
              <section key={family.id} className="stack-group">
                <div className="flex items-baseline gap-3">
                  <h2 className="font-display text-xl">{family.label}</h2>
                  <p className="text-xs text-[var(--color-muted)]">{family.note}</p>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {list.map((technique, i) => (
                    <TechniqueCard
                      key={technique.id}
                      technique={technique}
                      index={i}
                      last={lastByTechnique.get(technique.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="card stack-section p-6">
            <p className="marginalia">
              What these are and are not
            </p>
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
              Grounding techniques help you get through a bad hour. They do not treat anxiety,
              depression or trauma, and they are not a substitute for talking to someone. Each
              practice states its evidence honestly —{' '}
              <span className="text-[var(--color-ink-soft)]">{EVIDENCE_LABEL.trial}</span> means a
              randomised trial exists;{' '}
              <span className="text-[var(--color-ink-soft)]">{EVIDENCE_LABEL.clinical}</span>{' '}
              means clinicians teach it but the single skill has not been trialled on its own.
              DP Sahay AI records that you practised, never how you did.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              <Link
                to="/read/why-a-long-exhale-works"
                className="press inline-flex items-center gap-1.5 text-xs text-[var(--sec-calm)]"
              >
                Why a long exhale works so fast
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link
                to="/read/which-technique-when"
                className="press inline-flex items-center gap-1.5 text-xs text-[var(--sec-calm)]"
              >
                Which one, and when
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
            <div className="mt-5">
              <CrisisContacts variant="button" />
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/assessments"
              className="text-sm text-[var(--color-teal)] underline underline-offset-4"
            >
              Looking for the questionnaires instead?
            </Link>
          </div>
      </>
      )}
    </PageShell>
  );
}
