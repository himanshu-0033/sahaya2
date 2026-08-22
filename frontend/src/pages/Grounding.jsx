import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import PageShell from '../components/PageShell.jsx';
import CrisisContacts from '../components/CrisisContacts.jsx';
import { getSession } from '../lib/session.js';
import { getGroundingCatalog } from '../lib/api.js';
import { accent, alpha, EVIDENCE_LABEL, SPEED_LABEL, formatDuration } from '../lib/accents.js';

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
            className={`press rounded-full border px-4 py-2 text-sm transition-all duration-200 ${
              selected
                ? 'border-[var(--sec-calm)] bg-[var(--sec-calm)]/14 text-[var(--color-ink)]'
                : 'border-white/12 text-[var(--color-ink-soft)] lift hover:border-[var(--sec-calm)]/45'
            }`}
          >
            {mood.label}
          </button>
        );
      })}
    </div>
  );
}

function TechniqueCard({ technique, last, index }) {
  const { base, bright } = accent(technique.accent);

  return (
    <Link
      to={`/grounding/${technique.id}`}
      style={{
        animationDelay: `${Math.min(index, 8) * 45}ms`,
        borderColor: alpha(base, 0.22),
        background: `linear-gradient(145deg, ${alpha(base, 0.14)}, rgba(21, 23, 27, 0.85) 62%)`,
      }}
      className="animate-pop press lift group relative overflow-hidden rounded-3xl border p-5"
    >
      {/* A soft bloom in the corner, in the practice's own accent — the only
          thing distinguishing one card from the next at a glance. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full opacity-60 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle, ${alpha(bright, 0.35)}, transparent 68%)` }}
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-2xl leading-snug">{technique.name}</p>
            {technique.aka && (
              <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">{technique.aka}</p>
            )}
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[10px] whitespace-nowrap"
            style={{ background: alpha(base, 0.18), color: bright }}
          >
            {formatDuration(technique.seconds)}
          </span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
          {technique.tagline}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {technique.bestFor.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--color-ink)]/10 px-2.5 py-1 text-[10px] text-[var(--color-muted)]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-[10px] text-[var(--color-muted)]">
          <span>{SPEED_LABEL[technique.speed]}</span>
          <span className="flex items-center gap-2">
            {technique.videoCount > 0 && <span>{technique.videoCount} videos</span>}
            {last && <span style={{ color: bright }}>done {last}</span>}
          </span>
        </div>
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
  const session = getSession();

  const [data, setData] = useState(null);
  const [mood, setMood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session) {
      navigate('/');
      return;
    }
    getGroundingCatalog()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [session, navigate]);

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

      <div className="animate-slide-up mt-8">
        <h1 className="font-display text-[2.4rem] leading-[1.06] sm:text-5xl">
          Thirteen things
          <br />
          for when your
          <br />
          head is loud
          <span className="text-[var(--sec-calm)]">.</span>
        </h1>
        <p className="mt-5 max-w-lg text-sm leading-relaxed text-[var(--color-ink-soft)]">
          Short practices you run right here — the app counts, paces and prompts. Each says what
          it is for, how strong the evidence actually is, and links a guided video if you would
          rather be talked through it.
        </p>
      </div>

      {loading && <p className="mt-10 text-[var(--color-ink-soft)]">Loading…</p>}
      {error && <p className="mt-6 text-sm text-[var(--color-flag)]">{error}</p>}

      {data && (
        <>
          {data.streak > 0 && (
            <p className="mt-6 inline-block rounded-full border border-[var(--sec-calm)]/25 bg-[var(--sec-calm)]/12 px-4 py-2 text-xs">
              {data.streak} day{data.streak === 1 ? '' : 's'} in a row. Nice.
            </p>
          )}

          <section className="mt-10">
            <p className="marginalia">
              How are you right now?
            </p>
            <MoodPicker moods={data.moods} active={mood} onPick={setMood} />
          </section>

          {suggested && (
            <section className="mt-8">
              <p className="text-sm text-[var(--color-ink-soft)]">
                Start with the first one — they are in the order most people find useful.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
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

          <div className="mt-14">
            <p className="marginalia">
              {suggested ? 'Everything else' : 'The whole library'}
            </p>

            {grouped.map(([family, list]) => (
              <section key={family.id} className="mt-8">
                <div className="flex items-baseline gap-3">
                  <h2 className="font-display text-xl">{family.label}</h2>
                  <p className="text-xs text-[var(--color-muted)]">{family.note}</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
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

          <div className="glass mt-12 rounded-3xl p-6">
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
              Sahaya records that you practised, never how you did.
            </p>
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
